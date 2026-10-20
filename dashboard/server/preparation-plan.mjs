export const researchQuestions=[
 {id:'RQ1',text:'How does the literature bound the authority of agentic AI to take state-changing action in security operations, and at what unit of analysis?',constructs:['decision_authority','autonomy_tiering','approval_and_escalation','reversibility']},
 {id:'RQ2',text:'On what basis is human oversight allocated, and what operating conditions make it effective?',constructs:['reviewer_competence','workload_and_volume','explanation','trust_and_reliance','approval_and_escalation']},
 {id:'RQ3',text:'How are oversight and accountability allocated across provider, client and vendor, and what evidence lets a client verify exercised oversight?',constructs:['accountability_allocation','contract_and_service_terms','evidence_and_auditability','regulatory_duty']}
];
const batches=[
 ['Operational foundations',['RQ1','RQ3'],['R0482','R0852'],'Distinguish actual operational work and client visibility from design proposals.'],
 ['Closest proposals',['RQ1','RQ2'],['R0046','R0047'],'Identify already-addressed requirements and evaluated versus proposed mechanisms.'],
 ['Autonomy boundaries',['RQ1'],['R0003','R0007'],'Compare authority, approval and reversible actions without equating study designs.'],
 ['Provider–client relationship',['RQ3'],['R0071','R0176','R0195'],'Assess delegation and contracts, with transfer limits from outsourcing research.'],
 ['Human oversight conditions',['RQ2'],['R1306','R1625','R1691','R2158'],'Distinguish measured human performance from trust reports.'],
 ['Counterexamples and gap tests',['RQ1','RQ2','RQ3'],['R2752','R1474'],'Test the strong gap claim; record evidence that changes or narrows it.']
];
export function buildPreparationPlan(corpus,statements,crosswalk,state){
 const map=new Map(crosswalk.map(x=>[x.recordId,x]));
 const entry=r=>({recordId:r.record_id,title:r.title,tier:r.tier,relevance:r.relevance,paperId:map.get(r.record_id)?.paperId||null,identityStatus:map.get(r.record_id)?.status||'Unmatched',statementCount:statements.filter(s=>s.record_id===r.record_id).length});
 const readingQueue=batches.map(([title,rqs,ids,purpose],index)=>({order:index+1,title,rqs,purpose,records:ids.map(id=>corpus.find(r=>r.record_id===id)).filter(Boolean).map(entry)}));
 const used=new Set(batches.flatMap(b=>b[2]));readingQueue.push({order:7,title:'Remaining Tier 1 candidates',rqs:['RQ1','RQ2','RQ3'],purpose:'Assign relevance to an RQ after the focused batches; imported tiers are provisional priorities.',records:corpus.filter(r=>r.tier==='1'&&!used.has(r.record_id)).map(entry)});
 const provisionalThemes=researchQuestions.flatMap(q=>q.constructs.map(construct=>{const ss=statements.filter(s=>String(s['c_'+construct]).toLowerCase()==='true');return {rq:q.id,construct,status:'Candidate grouping from imported construct tags; not verified agreement',recordIds:[...new Set(ss.map(s=>s.record_id))],statementIds:ss.map(s=>s.statement_id),missingLocators:ss.filter(s=>!s.location||/not given|not reported|not supplied|unknown/i.test(s.location)).length};}));
 const writingPlan=researchQuestions.map(q=>({rq:q.id,question:q.text,argumentPrompt:'What does the evidence establish, under which conditions, and what does it fail to establish?',sections:q.id==='RQ1'?['2.3 Agentic autonomy']:q.id==='RQ2'?['2.4 Exercisable oversight']:['2.2 Managed relationships','2.5 Duty and assurance'],themes:provisionalThemes.filter(t=>t.rq===q.id),counterevidencePrompt:'Compare the same action, population and unit of analysis; retain contradictory evidence and shared-programme uncertainty.',next:'Verify source passages before drafting. Construct counts are coverage, not evidence strength.'}));
 const reconciliation=[
 {issue:'Retrieval chain arithmetic',status:'Open',detail:'Claude reports 341 included + 447 undecided = 787 sought; the sum is 788. Confirm overlap or correct the register before PRISMA.'},
 ...['oversight_mode','mssp_treatment','relevance'].map(field=>({issue:'Unknown '+field,status:'Open',detail:corpus.filter(r=>!r[field]?.trim()).length+' of '+corpus.length+' imported records have blank values; retain unknown category.'})),
 {issue:'HOTL denominator',status:'Open',detail:'Claude reports eight coded HOTL records and seven in corroboration. Resolve population/version difference.'},
 {issue:'M1 statement layer',status:'Not imported',detail:'Claude reports 178 M1 statements. Supporting file is absent from supplied folders; keep separate from 2321 I1–I5 statements.'},
 {issue:'Independent programmes',status:'Withdrawn',detail:'Do not use 224 or candidate 227 as independent-study denominators; confirm candidate clusters first.'},
 {issue:'Quote fidelity and verification',status:'Reported, not independently checked',detail:'Claude’s 879-quote audit needs its underlying file. Bibliographic verification does not verify claim content.'}
 ];
 const decisions=['Resolve 16 off-domain candidate exclusions','Declare stated versus inferred oversight-mode coding','Confirm programme clusters','Choose framework unit of analysis','Confirm state-changing-action boundary with supervisors','Evaluate theory candidates after deriving requirements','Decide placement of the five oversight conditions'];
 return {researchQuestions,readingQueue,provisionalThemes,writingPlan,reconciliation,decisions,context:{source:'research_state_atlas.md',date:'2026-10-08',status:'Claude-reported research state; supporting audit files not yet available',savedResearchQuestions:state.brief?.['Research questions']||'',boundary:'RQ labels and reading recommendations derive from the supplied research state and existing Atlas reading plan. They do not overwrite your saved brief.'}};
}
