import {PaperReading} from './paper-reading.mjs';
export class ReadingActivity {
 constructor(db,papers){this.db=db;this.papers=papers;this.coverage=new PaperReading(db,papers);db.exec('CREATE TABLE IF NOT EXISTS paper_reading(paper TEXT PRIMARY KEY,data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS reading_activity(seq INTEGER PRIMARY KEY AUTOINCREMENT,paper TEXT NOT NULL,data TEXT NOT NULL);');}
 get(id){this.papers.get(id);const row=this.db.prepare('SELECT data FROM paper_reading WHERE paper=?').get(id);const state=row?JSON.parse(row.data):{status:'not_started',bookmark:null};const c=this.coverage.get(id);state.status=c.confirmedAt?'read':c.visited.length||state.status==='reading'?'reading':'not_started';return state;}
 events(id){return this.db.prepare('SELECT seq,data FROM reading_activity WHERE paper=? ORDER BY seq DESC LIMIT 200').all(id).map(r=>({id:'reading:'+r.seq,...JSON.parse(r.data)})).reverse();}
 save(id,input){const p=this.papers.get(id),state=this.get(id);let text;
 if(input.action==='bookmark'){const page=Number(input.page);if(!Number.isInteger(page)||page<1||page>p.pages)throw Error('Choose a page within this PDF.');state.bookmark=page;text=`Bookmark saved: PDF page ${page}`;}
 else if(input.action==='status'){if(!['not_started','reading','read'].includes(input.status))throw Error('Invalid reading status.');if(input.status==='read'&&!this.coverage.get(id).confirmedAt)throw Error('Use the PDF reader: visit every page, reach the end and explicitly confirm full reading.');if(input.status!=='read'&&this.coverage.get(id).confirmedAt)this.coverage.save(id,{action:'reopen'});if(state.status===input.status)return state;state.status=input.status;text={not_started:'Reading reset to not started',reading:'Reading started',read:'Reading marked complete by you'}[input.status];}
 else throw Error('Unknown reading action.');
 const at=new Date().toISOString();state.updatedAt=at;this.db.exec('BEGIN');try{this.db.prepare('INSERT OR REPLACE INTO paper_reading VALUES(?,?)').run(id,JSON.stringify(state));this.db.prepare('INSERT INTO reading_activity(paper,data) VALUES(?,?)').run(id,JSON.stringify({at,channel:'reading',severity:'info',text}));this.db.exec('COMMIT');}catch(e){this.db.exec('ROLLBACK');throw e;}return state;
 }
}
