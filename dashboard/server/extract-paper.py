import json, sys
from pathlib import Path
from pypdf import PdfReader
source, target = sys.argv[1:3]
reader = PdfReader(source)
count = len(reader.pages)
start = int(sys.argv[3]) if len(sys.argv)>3 else 1
end = int(sys.argv[4]) if len(sys.argv)>4 else count
if start < 1 or end < start or end > count: raise ValueError('Page range is outside the PDF.')
meta = reader.metadata or {}
result = {'pages':count,'title':str(meta.get('/Title','') or ''),'author':str(meta.get('/Author','') or ''),'textPages':0,'lowTextPages':[],'glyphWarningPages':[],'scopeRequired':count>100 and len(sys.argv)<=3,'start':start,'end':end}
if result['scopeRequired']:
    result['quality']='scope_required'
else:
    sections=[]
    for index in range(start-1,end):
        text=reader.pages[index].extract_text() or ''
        if any(0xD800 <= ord(c) <= 0xDFFF for c in text):
            result['glyphWarningPages'].append(index+1)
            text=''.join('\ufffd' if 0xD800 <= ord(c) <= 0xDFFF else c for c in text)
        if len(text.strip()) < 80: result['lowTextPages'].append(index+1)
        else: result['textPages']+=1
        sections.append(f'\n\n=== PDF PAGE {index+1} ===\n\n{text}')
    Path(target).write_text(''.join(sections),encoding='utf8')
    result['quality']='check_extraction' if result['lowTextPages'] or result['glyphWarningPages'] else 'text_available'
print(json.dumps(result))
