import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
function load(path){const source=readFileSync(path,'utf8');const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});const mod={exports:{}};new Function('module','exports','require',outputText)(mod,mod.exports,require);return mod.exports;}
const {margin,daysInStock,preparationLabel,csvCell}=load('src/lib/operations.ts');
const {canAccess,canManage}=load('src/lib/permissions.ts');
const {allRows}=load('src/lib/pagination.ts');
await test('missing financial data never becomes a false positive margin',()=>{
 assert.equal(margin(null,1000,20000),null);assert.equal(margin(15000,1000,null),null);assert.equal(margin(15000,1000,20000),4000);assert.equal(margin(20000,2000,19000),-3000);
});
await test('stock age stops at sale and uses calendar dates',()=>{assert.equal(daysInStock('2026-01-01','2026-02-01','2026-09-01'),31);assert.equal(daysInStock(null,null),null);});
await test('readiness requires defined, completed preparation and delivery checks',()=>{
 assert.equal(preparationLabel([]),'Preparação por definir');assert.equal(preparationLabel([{stage:'preparation',status:'waiting_parts'}]),'A aguardar peças');assert.equal(preparationLabel([{stage:'preparation',status:'done'}]),'Pronta para anunciar');assert.equal(preparationLabel([{stage:'preparation',status:'done'},{stage:'delivery',status:'done'}]),'Pronta para entrega');
});
await test('CSV exports neutralize spreadsheet formulas and quote delimiters',()=>{assert.equal(csvCell('=1+1'),'"\'=1+1"');assert.equal(csvCell(' A,"B"'),'" A,""B"""');assert.equal(csvCell('+351910000000'),'"\'+351910000000"');});
await test('financial and mechanical access matches business roles',()=>{
 assert.equal(canAccess('mecanico',['leads'],'leads'),false);assert.equal(canAccess('vendedor',null,'financeiro'),false);assert.equal(canAccess('chefe',null,'financeiro'),true);assert.equal(canAccess('admin',[],'financeiro'),true);assert.equal(canManage('chefe','mecanico'),false);
});
await test('pagination reads every row and propagates failures',async()=>{
 const rows=Array.from({length:1203},(_,i)=>i);assert.equal((await allRows(async(a,b)=>({data:rows.slice(a,b+1),error:null}))).length,1203);
 await assert.rejects(allRows(async()=>({data:null,error:{message:'offline'}})),/offline/);
});
