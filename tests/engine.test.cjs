'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),E=require('../web/engine.js');
const copy=()=>structuredClone(E.initial);

test('Duplicate records collapse without losing occurrence count',()=>{const r=E.run(copy());assert.equal(r.metrics.unique,3);assert.equal(r.metrics.duplicates,1);assert.equal(r.rows.find(x=>x.package==='example-http').occurrences,2);});
test('A selected fixed version is only a proposal',()=>{const r=E.run(copy());assert.equal(r.rows.find(x=>x.package==='example-http').status,'fix proposed; rescan required');});
test('Incomplete rescans cannot resolve findings',()=>{const x=copy();x.postScan=[];assert.ok(!E.run(x).rows.some(r=>r.status.includes('absent')));x.postScanComplete=true;assert.ok(E.run(x).rows.every(r=>r.status.includes('absent')));});
test('An advisory present in rescan remains unresolved',()=>{const x=copy();x.postScanComplete=true;x.postScan=[x.findings[0]];assert.equal(E.run(x).rows.find(r=>r.package==='example-http').status,'fix proposed; rescan required');});
test('Exact version ordering handles multi-digit components',()=>{assert.equal(E.atLeast('1.10.0','1.9.9'),true);assert.equal(E.atLeast('1.2.2','1.2.3'),false);assert.throws(()=>E.atLeast('^1.2.3','1.0.0'));});
test('Different applications retain distinct remediation items',()=>{const x=copy();x.findings.push({...x.findings[0],id:'f5',app:'other'});assert.equal(E.run(x).metrics.unique,4);});
