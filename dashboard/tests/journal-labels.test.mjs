import test from 'node:test';
import assert from 'node:assert/strict';
import {rankingNames,quartileLabel,hasDocumentedQ1} from '../lib/journal-labels.ts';
test('journal labels expand abbreviations and require sourced category-specific Q1 for a gold badge',()=>{
 assert.match(rankingNames.SJR,/SCImago Journal Rank/);assert.match(rankingNames.JCR,/Journal Citation Reports/);assert.match(quartileLabel('Q1'),/top 25%/);
 const m={quartile:'Q1',category:'Information Systems',sourceUrl:'https://example.org/record',sourceEvidence:'Recorded category ranking'};
 assert.equal(hasDocumentedQ1(m),true);assert.equal(hasDocumentedQ1({...m,category:'Overall listing / best quartile; subject category not verified'}),false);assert.equal(hasDocumentedQ1({...m,quartile:'Q2'}),false);assert.equal(hasDocumentedQ1({...m,sourceEvidence:''}),false);assert.equal(hasDocumentedQ1({...m,sourceUrl:''}),false);
});
