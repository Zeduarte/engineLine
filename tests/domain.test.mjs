import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
// Resolve o alias `@/` como o tsconfig, para os módulos poderem importar-se
// entre si (ex.: permissions.ts -> vehicle-categories.ts).
const cache=new Map();
function resolveAlias(id){const base=`src/${id.slice(2)}`;for(const ext of ['.ts','.tsx','/index.ts'])if(existsSync(base+ext))return base+ext;throw new Error(`não resolvido: ${id}`);}
function load(path){
 if(cache.has(path))return cache.get(path);
 const source=readFileSync(path,'utf8');
 const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 const mod={exports:{}};cache.set(path,mod.exports);
 const localRequire=(id)=>id.startsWith('@/')?load(resolveAlias(id)):require(id);
 new Function('module','exports','require',outputText)(mod,mod.exports,localRequire);
 cache.set(path,mod.exports);return mod.exports;}
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

const {MarkerBuffer,safeEmitLength}=load('src/lib/chat/stream-marker.ts');
await test('chat streaming never leaks the action marker to the visitor',()=>{
 // Entregue aos pedaços, como vem da API: o marcador nunca pode ser mostrado.
 const buf=new MarkerBuffer();let shown='';
 for(const d of ['Tem gara','ntia de 18 meses.','\n\n[[','ACOES: inte','ressado, cont','actos]]']) shown+=buf.push(d);
 assert.equal(shown,'Tem garantia de 18 meses.');
 assert.ok(buf.raw.includes('[[ACOES:'));
 // Parênteses retos normais no texto continuam a passar.
 const plain=new MarkerBuffer();
 assert.equal(plain.push('Ver [aqui] o stock.')+plain.push(' Obrigado.'),'Ver [aqui] o stock. Obrigado.');
 // Um "[" final fica retido até se saber que não é um marcador.
 assert.equal(safeEmitLength('Preço [['),5);
 assert.equal(safeEmitLength('Preço 10.000 €'),14);
});

const {normalizeLocationIds,describeIssuePath}=load('src/lib/showroom.ts');
await test('point-of-sale identifiers are generated, never blocking the user',()=>{
 // Um id válido é estável: as viaturas ligam-se a ele.
 const estavel=normalizeLocationIds([{id:'penafiel',name:'Stand Penafiel'}]);
 assert.equal(estavel[0].id,'penafiel');

 // O que o utilizador escreveu ("Supermotas") não passa na regra → gera-se.
 const corrigido=normalizeLocationIds([{id:'Supermotas',name:'Supermotas'}]);
 assert.equal(corrigido[0].id,'supermotas');
 assert.equal(normalizeLocationIds([{id:'',name:'Cabeça Santa'}])[0].id,'cabeca-santa');
 assert.equal(normalizeLocationIds([{id:'!!',name:''}])[0].id,'ponto-1');

 // Dois pontos nunca ficam com o mesmo id.
 const repetidos=normalizeLocationIds([
  {id:'Supermotas',name:'Supermotas'},
  {id:'supermotas',name:'Supermotas'},
 ]);
 assert.deepEqual(repetidos.map(p=>p.id),['supermotas','supermotas-2']);
});
await test('validation errors name the section instead of the array index',()=>{
 assert.equal(describeIssuePath(['locations',0,'address']),'Ponto de venda 1 · morada');
 assert.equal(describeIssuePath(['faqs',2,'question']),'Pergunta 3 · pergunta');
 assert.equal(describeIssuePath(['services',1]),'Serviço 2');
});

const {showroomSchema,DEFAULT_SHOWROOM}=load('src/lib/showroom.ts');
await test('the exact value that blocked saving now passes validation',()=>{
 const ponto={id:'Supermotas',name:'Supermotas',address:'Av. Cruzeiro das Lampreias n 727',
  city:'Cabeça Santa',postalCode:'4575-134',phone:'916100742',email:'',
  hours:'9h-13h e 14h-19h',latitude:null,longitude:null};
 const conteudo={...structuredClone(DEFAULT_SHOWROOM),locations:[ponto]};
 // Como estava: o formulário mandava o id tal e qual e a gravação falhava.
 assert.equal(showroomSchema.safeParse(conteudo).success,false);
 // Como fica: o id é corrigido antes de validar.
 const corrigido={...conteudo,locations:normalizeLocationIds(conteudo.locations)};
 const r=showroomSchema.safeParse(corrigido);
 assert.equal(r.success,true,JSON.stringify(r.error?.issues));
 assert.equal(r.data.locations[0].id,'supermotas');
});

const L=load('src/lib/leave.ts');
await test('portuguese holidays follow Easter and cover the fixed dates',()=>{
 // Datas de Páscoa conhecidas.
 assert.equal(L.isoDay(L.easterSunday(2026)),'2026-04-05');
 assert.equal(L.isoDay(L.easterSunday(2027)),'2027-03-28');
 assert.equal(L.isoDay(L.easterSunday(2024)),'2024-03-31');

 const f=L.nationalHolidays(2026);
 assert.equal(f.length,13);
 const dias=f.map(d=>d.day);
 for(const fixo of ['2026-01-01','2026-04-25','2026-05-01','2026-06-10','2026-08-15',
                    '2026-10-05','2026-11-01','2026-12-01','2026-12-08','2026-12-25'])
  assert.ok(dias.includes(fixo),fixo);
 assert.ok(dias.includes('2026-04-03'),'Sexta-feira Santa');
 assert.ok(dias.includes('2026-06-04'),'Corpo de Deus');
 assert.deepEqual(dias,[...dias].sort());
});
await test('only working days that are not holidays can be booked',()=>{
 const cal=L.companyCalendar(2026,[
  {day:'2026-06-29',kind:'holiday',label:'São Pedro'},
  {day:'2026-02-17',kind:'tolerance',label:'Carnaval'},
  {day:'2026-12-24',kind:'mandatory',label:'Véspera de Natal'},
 ]);
 assert.equal(L.isSelectable('2026-07-13',cal),true,'segunda-feira normal');
 assert.equal(L.isSelectable('2026-07-11',cal),false,'sábado');
 assert.equal(L.isSelectable('2026-01-01',cal),false,'feriado nacional');
 assert.equal(L.isSelectable('2026-06-29',cal),false,'feriado municipal');
 assert.equal(L.isSelectable('2026-02-17',cal),false,'tolerância');
 // Dia obrigatório é marcado pela empresa, mas continua a sair do saldo.
 assert.equal(L.isSelectable('2026-12-24',cal),true);
 // Os extras de outro ano não entram.
 assert.equal(L.companyCalendar(2026,[{day:'2025-06-29',kind:'holiday',label:'x'}]).has('2025-06-29'),false);
});
await test('leave balance adds carry-over and the birthday, and ignores rejected days',()=>{
 const saldo={baseDays:22,carriedDays:3,birthdayDay:1};
 const dias=[
  {day:'2026-07-13',half:false,status:'approved'},
  {day:'2026-07-14',half:false,status:'approved'},
  {day:'2026-07-15',half:true, status:'pending'},
  {day:'2026-08-03',half:false,status:'draft'},
  {day:'2026-09-01',half:false,status:'rejected'},
 ];
 const r=L.summarise(saldo,dias);
 assert.equal(r.total,26);
 assert.equal(r.approved,2);
 assert.equal(r.pending,0.5);
 assert.equal(r.marked,3.5,'recusado não conta');
 assert.equal(r.available,22.5);
 // Sem dias marcados o saldo é o total.
 assert.equal(L.summarise(L.DEFAULT_BALANCE,[]).available,23);
});
await test('consecutive days group into one request, across weekends',()=>{
 const dias=['2026-07-13','2026-07-14','2026-07-15','2026-07-16','2026-07-17']
  .map(day=>({day,half:false,status:'pending'}));
 const g=L.groupRanges(dias);
 assert.equal(g.length,1);
 assert.equal(L.describeRange(g[0].from,g[0].to),'13 a 17 de julho');

 // Sexta e a segunda seguinte são o mesmo período; um salto maior não é.
 const ponte=L.groupRanges([
  {day:'2026-07-17',half:false,status:'pending'},
  {day:'2026-07-20',half:false,status:'pending'},
 ]);
 assert.equal(ponte.length,1,'fim de semana pelo meio não quebra');
 const separados=L.groupRanges([
  {day:'2026-07-13',half:false,status:'pending'},
  {day:'2026-07-22',half:false,status:'pending'},
 ]);
 assert.equal(separados.length,2);
 // Estados diferentes nunca se juntam no mesmo pedido.
 assert.equal(L.groupRanges([
  {day:'2026-07-13',half:false,status:'approved'},
  {day:'2026-07-14',half:false,status:'pending'},
 ]).length,2);
 assert.equal(L.describeRange('2026-12-24','2026-12-24'),'24 de dezembro');
 assert.equal(L.describeRange('2026-07-30','2026-08-03'),'30 de julho a 3 de agosto');
});

const {canDecideLeaveFor,leaveSelfApproves}=load('src/lib/permissions.ts');
await test('leave approval follows the hierarchy, and only admins self-approve',()=>{
 // O administrador está no topo.
 assert.equal(canDecideLeaveFor('admin','chefe'),true);
 assert.equal(canDecideLeaveFor('admin','admin'),true);
 // O chefe decide quem está abaixo, nunca um par nem um superior.
 assert.equal(canDecideLeaveFor('chefe','vendedor'),true);
 assert.equal(canDecideLeaveFor('chefe','mecanico'),true);
 assert.equal(canDecideLeaveFor('chefe','chefe'),false,'um par não decide');
 assert.equal(canDecideLeaveFor('chefe','admin'),false,'nunca um superior');
 // Quem não gere ninguém não decide nada.
 assert.equal(canDecideLeaveFor('vendedor','vendedor'),false);
 assert.equal(canDecideLeaveFor('mecanico','vendedor'),false);
 // Só o administrador aprova o próprio plano ao submetê-lo.
 assert.equal(leaveSelfApproves('admin'),true);
 for(const r of ['chefe','vendedor','mecanico']) assert.equal(leaveSelfApproves(r),false,r);
});
