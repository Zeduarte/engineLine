// Ordens por WhatsApp — as partes puras.
//
// Tudo o que decide o que fica gravado (matrícula, viatura, valor, frase) vive
// em funções puras de propósito, para ser testável sem base de dados, sem rede
// e sem gastar uma chamada ao modelo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHmac } from 'node:crypto';
const require=createRequire(import.meta.url);
const cache=new Map();
function withExt(base){for(const ext of ['.ts','.tsx','/index.ts'])if(existsSync(base+ext))return base+ext;throw new Error(`não resolvido: ${base}`);}
function resolveAlias(id){return withExt(`src/${id.slice(2)}`);}
function resolveRelative(from,id){return withExt(new URL(id,new URL(from,'file:///')).pathname.slice(1));}
function load(path){
 if(cache.has(path))return cache.get(path);
 const source=readFileSync(path,'utf8');
 const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 const mod={exports:{}};cache.set(path,mod.exports);
 const localRequire=(id)=>id.startsWith('@/')?load(resolveAlias(id)):id.startsWith('.')?load(resolveRelative(path,id)):require(id);
 new Function('module','exports','require',outputText)(mod,mod.exports,localRequire);
 cache.set(path,mod.exports);return mod.exports;}

const {plateKey,formatPlate,isPlausiblePlate}=load('src/lib/plate.ts');
await test('a plate compares by its canonical form, however it was typed',()=>{
 // Na base de dados há matrículas com hífenes (formulário) e sem (oficina): sem
 // esta forma canónica, a mesma viatura parecia duas.
 for(const p of ['33-AD-22','33ad22','33 AD 22',' 33-ad-22 '])
  assert.equal(plateKey(p),'33AD22',p);
 // A forma mostrada não muda — não-regressão do que o formulário já fazia.
 assert.equal(formatPlate('44vs23'),'44-VS-23');
 assert.equal(formatPlate('00TE00'),'00-TE-00');
 assert.equal(formatPlate('abcdefghij'),'AB-CD-EF','corta aos 6');
 assert.equal(formatPlate(''),'');
 assert.equal(isPlausiblePlate('33-AD-22'),true);
 assert.equal(isPlausiblePlate('AB'),false);
 assert.equal(isPlausiblePlate('320d'),false,'um modelo não é uma matrícula');
});

const {normalizeWhatsApp}=load('src/lib/phone.ts');
await test('a phone is the same person with or without the country code',()=>{
 for(const p of ['916193337','351916193337','+351 916 193 337','916 193 337'])
  assert.equal(normalizeWhatsApp(p),'351916193337',p);
 // Um número estrangeiro fica intacto: não se lhe cola o 351.
 assert.equal(normalizeWhatsApp('4915112345678'),'4915112345678');
});

const {verifySignature,verifyChallenge,MAX_BODY_BYTES}=load('src/lib/whatsapp/signature.ts');
const SEGREDO='segredo-de-teste';
const assina=(corpo)=>'sha256='+createHmac('sha256',SEGREDO).update(corpo,'utf8').digest('hex');
await test('only a request really signed by Meta is accepted',()=>{
 const corpo='{"object":"whatsapp_business_account","entry":[]}';
 assert.equal(verifySignature(corpo,assina(corpo),SEGREDO),true);
 // Um byte trocado no corpo invalida.
 assert.equal(verifySignature(corpo.replace('entry','entrY'),assina(corpo),SEGREDO),false);
 // Um corpo que só difere em espaços também: é por isso que a rota compara os
 // bytes em bruto e nunca o JSON reserializado.
 assert.equal(verifySignature(corpo.replace('","','", "'),assina(corpo),SEGREDO),false);
 assert.equal(verifySignature(corpo,null,SEGREDO),false,'sem cabeçalho');
 assert.equal(verifySignature(corpo,'sha256=abc',SEGREDO),false,'comprimento errado, sem estourar');
 assert.equal(verifySignature(corpo,assina(corpo),''),false,'sem segredo configurado');
 assert.equal(verifySignature(corpo,assina(corpo),'outro'),false,'segredo errado');
 // Corpo absurdo nem chega a ser processado.
 const enorme='x'.repeat(MAX_BODY_BYTES+1);
 assert.equal(verifySignature(enorme,assina(enorme),SEGREDO),false);
});
await test('the subscription handshake only answers to the agreed token',()=>{
 const p=(o)=>new URLSearchParams(o);
 assert.equal(verifyChallenge(p({'hub.mode':'subscribe','hub.verify_token':'tok','hub.challenge':'123'}),'tok'),'123');
 assert.equal(verifyChallenge(p({'hub.mode':'subscribe','hub.verify_token':'errado','hub.challenge':'123'}),'tok'),null);
 assert.equal(verifyChallenge(p({'hub.mode':'unsubscribe','hub.verify_token':'tok','hub.challenge':'123'}),'tok'),null);
 assert.equal(verifyChallenge(p({'hub.mode':'subscribe','hub.verify_token':'tok','hub.challenge':'123'}),''),null,'sem token configurado');
});

const {extractMessages}=load('src/lib/whatsapp/payload.ts');
const envelope=(value)=>({object:'whatsapp_business_account',entry:[{id:'w',changes:[{field:'messages',value}]}]});
const texto=(id,body)=>({id,from:'351916193337',timestamp:'1',type:'text',text:{body}});
await test('reading Meta payloads never throws and ignores what is not a message',()=>{
 const meta={phone_number_id:'123'};
 // Os recibos de entrega são a maioria do tráfego e não são mensagens.
 assert.equal(extractMessages(envelope({metadata:meta,statuses:[{id:'x',status:'delivered'}]})).length,0);
 const uma=extractMessages(envelope({metadata:meta,messages:[texto('wamid.1','olá')]}));
 assert.equal(uma.length,1);
 assert.deepEqual(uma[0],{wamId:'wamid.1',from:'351916193337',type:'text',text:'olá',phoneNumberId:'123'});
 // Listas com mais de um elemento: percorrer, não indexar o primeiro.
 const duas={object:'x',entry:[
  {changes:[{value:{metadata:meta,messages:[texto('wamid.1','a')]}}]},
  {changes:[{value:{metadata:meta,messages:[texto('wamid.2','b'),texto('wamid.3','c')]}}]}]};
 assert.deepEqual(extractMessages(duas).map(m=>m.wamId),['wamid.1','wamid.2','wamid.3']);
 // Uma imagem aparece, para se poder responder "só entendo texto".
 const img=extractMessages(envelope({metadata:meta,messages:[{id:'wamid.9',from:'351',type:'image',image:{id:'i'}}]}));
 assert.deepEqual(img.map(m=>[m.type,m.text]),[['image','']]);
 // E nada disto estoura.
 for(const mau of [null,undefined,{},{entry:'x'},{entry:[{changes:null}]},{entry:[{changes:[{}]}]},'texto',42])
  assert.equal(extractMessages(mau).length,0,JSON.stringify(mau));
 // Uma mensagem sem id ou sem remetente é descartada.
 assert.equal(extractMessages(envelope({metadata:meta,messages:[{type:'text',text:{body:'x'}}]})).length,0);
});

const {readConfirmation,isUsable}=load('src/lib/whatsapp/confirm.ts');
await test('confirmation is read by equality, never by "contains"',()=>{
 for(const s of ['sim','SIM','Sim.','  sim  ','ok','confirmo','certo','exato','👍'])
  assert.equal(readConfirmation(s),'yes',s);
 for(const n of ['não','nao','NÃO','cancela','esquece','errado','❌'])
  assert.equal(readConfirmation(n),'no',n);
 // O caso que protege o valor: isto é um pedido novo, não uma confirmação.
 assert.equal(readConfirmation('sim, mas muda para 500'),'other');
 assert.equal(readConfirmation('sim sim mas no audi'),'other');
 assert.equal(readConfirmation('450'),'other');
 assert.equal(readConfirmation(''),'other');
});
await test('a proposal is only usable while pending and in time',()=>{
 const agora=new Date('2026-09-24T10:00:00Z');
 assert.equal(isUsable({status:'pending',expires_at:'2026-09-24T10:05:00Z'},agora),true);
 assert.equal(isUsable({status:'pending',expires_at:'2026-09-24T09:59:59Z'},agora),false,'expirou');
 assert.equal(isUsable({status:'pending',expires_at:'2026-09-24T10:00:00Z'},agora),false,'no limite');
 for(const s of ['confirmed','cancelled','expired','superseded'])
  assert.equal(isUsable({status:s,expires_at:'2026-09-24T10:05:00Z'},agora),false,s);
});

const {rankVehicles}=load('src/lib/whatsapp/match.ts');
const frota=[
 {id:'a',make:'BMW',model:'320',color:'Preto',license_plate:'33-AD-22',status:'published'},
 {id:'b',make:'Bmw',model:'320',color:'Cinzento',license_plate:'44-VS-23',status:'published'},
 {id:'c',make:'Audi',model:'A1',color:'Branco',license_plate:'12-AB-34',status:'published'},
];
await test('finding a vehicle: the plate decides, and ambiguity is never guessed',()=>{
 // A matrícula ganha mesmo quando a marca escrita está errada.
 assert.deepEqual(rankVehicles({matricula:'33ad22',marca:'Audi'},frota).map(v=>v.id),['a']);
 assert.deepEqual(rankVehicles({matricula:'33-AD-22'},frota).map(v=>v.id),['a']);
 // Dois BMW 320 e nenhuma cor: pergunta-se.
 assert.equal(rankVehicles({texto:'bmw 320'},frota).length,2,'ambíguo');
 // Com a cor há um vencedor claro. Nota: "Bmw" e "BMW" contam como a mesma marca.
 assert.deepEqual(rankVehicles({texto:'bmw 320 preto'},frota).map(v=>v.id),['a']);
 assert.deepEqual(rankVehicles({texto:'bmw 320 cinzento'},frota).map(v=>v.id),['b']);
 // Nada que encaixe.
 assert.equal(rankVehicles({texto:'mercedes classe a'},frota).length,0);
 assert.equal(rankVehicles({},frota).length,0,'sem pistas não se devolve o stock');
 // O que a pessoa não pode ver nunca entra na lista — quem filtra é o SQL.
 assert.equal(rankVehicles({texto:'audi a1'},frota.filter(v=>v.id!=='c')).length,0);
});

const {formatMoney,formatDay,vehicleLabel,describeAction,confirmationMessage,receiptMessage}=load('src/lib/whatsapp/describe.ts');
await test('money in a receipt keeps its cents',()=>{
 // O formatPrice do site arredonda (é para preços de anúncio); num recibo de
 // despesa 450,50 € não pode virar "451 €".
 assert.match(formatMoney(450.5),/450,50/);
 assert.match(formatMoney(450),/450/);
 assert.equal(/,/.test(formatMoney(450)),false,'um valor redondo não leva cêntimos');
 assert.match(formatMoney(1250.75),/1\s?250,75/);
 assert.equal(formatDay('2026-09-24'),'24/09/2026');
 assert.equal(vehicleLabel({make:'BMW',model:'320',license_plate:'33AD22'}),'BMW 320, matrícula 33-AD-22');
 assert.equal(vehicleLabel({make:'BMW',model:'320'}),'BMW 320');
});
await test('the sentence the person reads is the record that gets written',()=>{
 const despesa={kind:'add_cost',carId:'a',veiculo:'BMW 320, matrícula 33-AD-22',
  categoria:'parts',descricao:'troca da embraiagem e revisão geral',valor:450,data:'2026-09-24'};
 const pergunta=confirmationMessage(despesa);
 const recibo=receiptMessage(despesa);
 // Tudo o que é gravado tem de estar nas duas frases.
 for(const parte of ['BMW 320','33-AD-22','450','embraiagem','24/09/2026']){
  assert.ok(pergunta.includes(parte),`pergunta sem "${parte}": ${pergunta}`);
  assert.ok(recibo.includes(parte),`recibo sem "${parte}": ${recibo}`);
 }
 assert.match(pergunta,/Vai ser adicionada/);
 assert.match(pergunta,/Confirma\?/);
 assert.match(recibo,/Foi adicionada/);
 assert.equal(/Confirma\?/.test(recibo),false,'o recibo não volta a perguntar');
 // As outras duas acções.
 assert.match(describeAction({kind:'register_vehicle',nome:'Audi A1',matricula:'00TE00',tipo:'car'},'passado'),
  /Audi A1.*00-TE-00/);
 assert.match(describeAction({kind:'log_hours',carId:'a',veiculo:'BMW 320',data:'2026-09-24',
  inicio:'09:00',fim:'17:30',horas:8.5,descricao:'Travões'},'futuro'),/09:00.*17:30.*8,5 h.*Travões/);
});

const {buildRegister,buildCost,buildHours,canUseCategory}=load('src/lib/whatsapp/actions.ts');
const viatura={carId:'a',veiculo:'BMW 320, matrícula 33-AD-22'};
const HOJE='2026-09-24';
await test('cost categories follow the same rule as the backoffice',()=>{
 // Material basta a Oficina; dinheiro de gestão exige Custos e margens.
 assert.equal(canUseCategory('parts',['oficina']),true);
 assert.equal(canUseCategory('other',['oficina']),true);
 assert.equal(canUseCategory('labour',['oficina']),false);
 assert.equal(canUseCategory('transport',['oficina']),false);
 for(const c of ['parts','labour','transport','preparation','other'])
  assert.equal(canUseCategory(c,['financeiro']),true,c);
 assert.equal(canUseCategory('parts',['leads']),false);
});
await test('a proposal that cannot be executed is never shown to the person',()=>{
 const base={viatura:'V1',categoria:'parts',valor:450,descricao:'Embraiagem'};
 assert.equal(buildCost(base,viatura,['oficina'],HOJE).ok,true);
 // O mecânico a escolher mão de obra recebe uma frase útil, não "sem permissão".
 const mo=buildCost({...base,categoria:'labour'},viatura,['oficina'],HOJE);
 assert.equal(mo.ok,false);
 assert.match(mo.error,/horas/);
 // Quem não tem nenhuma das duas secções é recusado de outra maneira.
 assert.match(buildCost(base,viatura,['leads'],HOJE).error,/Custos e margens/);
 // Datas no futuro não passam.
 assert.equal(buildCost({...base,data:'2026-09-25'},viatura,['financeiro'],HOJE).ok,false);
 assert.equal(buildCost({...base,data:'2026-09-24'},viatura,['financeiro'],HOJE).ok,true);
 // Os cêntimos sobrevivem, sem lixo de vírgula flutuante.
 assert.equal(buildCost({...base,valor:450.555},viatura,['financeiro'],HOJE).action.valor,450.56);
});
await test('registering a vehicle needs the workshop and a plausible plate',()=>{
 const bom=buildRegister({nome:'Audi A1',matricula:'00-TE-00',tipo:'car'},['oficina']);
 assert.equal(bom.ok,true);
 assert.equal(bom.action.matricula,'00TE00');
 assert.match(buildRegister({nome:'Audi A1',matricula:'00-TE-00',tipo:'car'},['financeiro']).error,/Oficina/);
 assert.match(buildRegister({nome:'Audi A1',matricula:'AB',tipo:'car'},['oficina']).error,/matrícula/);
});
await test('hours reuse the backoffice rule: no zero, no silent night shift',()=>{
 const base={viatura:'V1',data:HOJE,inicio:'09:00',fim:'17:30',noite:false};
 const ok=buildHours(base,viatura,['oficina'],HOJE);
 assert.equal(ok.ok,true);
 assert.equal(ok.action.horas,8.5);
 assert.match(buildHours({...base,fim:'09:00'},viatura,['oficina'],HOJE).error,/igual ao início/);
 assert.match(buildHours({...base,inicio:'11:00',fim:'10:00'},viatura,['oficina'],HOJE).error,/dia seguinte/);
 // Declarado como nocturno, aceita-se.
 const noite=buildHours({...base,inicio:'22:00',fim:'02:00',noite:true},viatura,['oficina'],HOJE);
 assert.equal(noite.action.horas,4);
 assert.match(buildHours(base,viatura,['financeiro'],HOJE).error,/Oficina/);
 assert.equal(buildHours({...base,data:'2026-09-25'},viatura,['oficina'],HOJE).ok,false);
});
