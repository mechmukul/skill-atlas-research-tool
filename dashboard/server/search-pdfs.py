"""Read-only full-document indexing and highlighted page rendering; originals are never saved."""
import sys,json,os,base64,re
import fitz

# MuPDF repair diagnostics must never contaminate the JSON protocol on stdout.
fitz.TOOLS.mupdf_display_errors(False)
fitz.TOOLS.mupdf_display_warnings(False)

def content(page,reader=False):
    words=page.get_text('words',sort=not reader)
    text=''; spans=[]
    for word in words:
        if text:text+=' '
        start=len(text);text+=word[4]
        # JavaScript indexes UTF-16 code units, not Python code points.
        spans.append((len(text[:start].encode('utf-16-le'))//2,len(text.encode('utf-16-le'))//2,word[:4]))
    return text,spans

mode=sys.argv[1]
if mode=='index':
    entries=json.load(open(sys.argv[2]))
    for entry in entries:
        try:
            with fitz.open(entry['pdf']) as doc:
                pages=[]
                for page in doc:
                    # Avoid computing character rectangles during indexing.
                    text=' '.join(w[4] for w in page.get_text('words',sort=True))
                    pages.append({'page':page.number+1,'text':text})
            result={'pages':pages,'fingerprint':entry['fingerprint']}
        except Exception as e:result={'pages':[],'error':str(e),'fingerprint':entry['fingerprint']}
        temp=entry['output']+'.tmp';json.dump(result,open(temp,'w'));os.replace(temp,entry['output'])
        print(json.dumps({'done':entry['id']}),flush=True)
elif mode=='reader-text':
    with fitz.open(sys.argv[2]) as doc:
        print(json.dumps({'pages':[{'page':p.number+1,'width':p.rect.width,'height':p.rect.height,'text':' '.join(w[4] for w in p.get_text('words',sort=False))} for p in doc]}))
else:
    source,page_number,payload=sys.argv[2],int(sys.argv[3]),json.loads(sys.stdin.read())
    ranges=payload if isinstance(payload,list) else payload.get('ranges',[])
    reader=isinstance(payload,dict) and payload.get('reader',False)
    with fitz.open(source) as doc:
        page=doc[page_number-1];text,spans=content(page,reader)
        for start,end in ranges:
            rects=[fitz.Rect(rect) for a,b,rect in spans if a<end and b>start]
            if rects:
                annotation=page.add_highlight_annot(rects);annotation.set_colors(stroke=(1,.78,.05));annotation.set_opacity(.45);annotation.update()
        scale=min(2,1600/max(page.rect.width,1))
        pix=page.get_pixmap(matrix=fitz.Matrix(scale,scale),alpha=False)
        result={'image':'data:image/png;base64,'+base64.b64encode(pix.tobytes('png')).decode(),'width':pix.width,'height':pix.height,'text':text}
        if reader:
            width,height=page.rect.width,page.rect.height
            spans=[(a,b,tuple(fitz.Rect(rect)*page.rotation_matrix)) for a,b,rect in spans]
            result['words']=[{'start':a,'end':b,'text':text.encode('utf-16-le')[a*2:b*2].decode('utf-16-le'),'x':max(0,(rect[0]-page.rect.x0)/width),'y':max(0,(rect[1]-page.rect.y0)/height),'w':(rect[2]-rect[0])/width,'h':(rect[3]-rect[1])/height} for a,b,rect in spans]
            result['outline']=[{'level':level,'title':title,'page':n} for level,title,n in doc.get_toc()[:500] if 1<=n<=len(doc)]
            # References are extracted as source text, never treated as resolved identities.
            refs=[];started=False
            for n in range(max(0,len(doc)-30),len(doc)):
                blocks=doc[n].get_text('blocks',sort=True)
                for block in blocks:
                    raw=block[4].strip()
                    heading=re.match(r'^(?:[0-9]+[. ]+)?(?:references|bibliography|works cited)\b',raw,re.I)
                    if heading:
                        started=True;raw=raw[heading.end():].strip()
                        if not raw:continue
                    if not started:continue
                    parts=re.split(r'(?m)^\s*\[?([0-9]{1,4})(?:\]|[.])\s+',raw)
                    if len(parts)>1:
                        for i in range(1,len(parts)-1,2):refs.append({'label':parts[i],'text':parts[i+1][:1800],'page':n+1})
                    elif len(raw)>40 and re.search(r'\b(?:19|20)\d{2}\b',raw):refs.append({'label':'','text':raw[:1800],'page':n+1})
                    if len(refs)>=500:break
                if len(refs)>=500:break
            result['references']=refs[:500]
            result['printedLabel']=page.get_label() or ''
        print(json.dumps(result))
