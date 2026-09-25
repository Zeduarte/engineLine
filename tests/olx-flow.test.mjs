// Sincronização com o OLX, ponta a ponta, contra um OLX simulado.
//
// O que isto prova: criar, atualizar, reativar e retirar anúncios; que uma
// segunda tentativa não duplica o anúncio; que o token é renovado sozinho; e
// que os erros do OLX chegam ao backoffice em português.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);

// ---- OLX simulado ---------------------------------------------------------
const olx={adverts:new Map(),next:500,calls:[],token:'tok-1',refresh:'ref-1',expireNext:false,rejectNext:null};
const server=http.createServer(async(req,res)=>{
 let raw='';for await(const c of req)raw+=c;
 const body=raw?JSON.parse(raw):null;
 const url=new URL(req.url,'http://x');
 olx.calls.push(`${req.method} ${url.pathname}${url.search}`);
 const send=(code,obj)=>{res.writeHead(code,{'Content-Type':'application/json'});res.end(obj===undefined?'':JSON.stringify(obj));};
 if(url.pathname==='/api/open/oauth/token'){
  if(body.grant_type==='refresh_token'&&body.refresh_token!==olx.refresh)return send(400,{error:'invalid_grant'});
  olx.token=`tok-${olx.calls.length}`;olx.refresh=`ref-${olx.calls.length}`;
  return send(200,{access_token:olx.token,refresh_token:olx.refresh,expires_in:86400});
 }
 if(req.headers.version!=='2.0')return send(400,{error:{detail:"Missing required 'Version' header!"}});
 if(req.headers.authorization!==`Bearer ${olx.token}`||olx.expireNext){olx.expireNext=false;return send(401,{error:'invalid_token'});}
 const m=url.pathname.match(/^\/api\/partner\/adverts(?:\/(\d+))?(\/commands)?$/);
 if(m&&req.method==='GET'&&!m[1]){
  const ext=url.searchParams.get('external_id');
  return send(200,{data:[...olx.adverts.values()].filter(a=>a.external_id===ext)});
 }
 if(m&&req.method==='POST'&&!m[1]){
  if(olx.rejectNext){const r=olx.rejectNext;olx.rejectNext=null;return send(400,r);}
  const id=olx.next++;const ad={...body,id,status:'active',url:`https://www.olx.pt/d/anuncio/${id}`};
  olx.adverts.set(id,ad);return send(200,{data:ad});
 }
 if(m&&m[1]&&!m[2]){
  const ad=olx.adverts.get(Number(m[1]));if(!ad)return send(404,{error:{detail:'Advert not found'}});
  if(req.method==='PUT')Object.assign(ad,body);
  return send(200,{data:ad});
 }
 if(m&&m[2]){
  const ad=olx.adverts.get(Number(m[1]));
  if(body.command==='deactivate'){ad.status='removed_by_user';ad.sold=body.is_success;}
  if(body.command==='activate')ad.status='active';
  return send(204);
 }
 send(404,{error:{detail:'not simulated'}});
});
await new Promise(r=>server.listen(0,r));
process.env.OLX_BASE_URL=`http://127.0.0.1:${server.address().port}`;
process.env.OLX_CLIENT_ID='cid';process.env.OLX_CLIENT_SECRET='csec';
process.env.NEXT_PUBLIC_SUPABASE_URL='https://proj.supabase.co';

// ---- Base de dados em memória, só o que o sync usa ------------------------
const CAR='11111111-1111-4111-8111-111111111111';
function makeDb(){
 const t={
  cars:[{id:CAR,slug:'bmw-320d',make:'Bmw',model:'320d',variant:null,year:2018,registration_month:null,mileage:120000,
   fuel:'Diesel',transmission:'Manual',body:'Berlina',power:190,displacement:1995,color:'Preto',doors:4,seats:5,
   price:18500,price_on_request:false,description:'Muito estimado.',tagline:null,extras:['GPS'],status:'published',
   channels:['olx'],vehicle_type:'car'}],
  car_media:[{car_id:CAR,storage_path:'bmw/1.jpg',kind:'image',position:0,is_cover:true}],
  channel_listings:[],
  // Os tokens em vigor no OLX simulado (que os renova durante os testes).
  olx_connection:[{id:1,access_token:olx.token,refresh_token:olx.refresh,expires_at:new Date(Date.now()+86400e3).toISOString(),
   city_id:17,updated_at:new Date().toISOString()}],
  olx_category_cache:[{vehicle_type:'car',category_id:181,category_name:'Carros',photos_limit:8,attributes:[
   {code:'make',label:'Marca',validation:{required:true},values:[{code:'bmw',label:'BMW'}]},
   {code:'fuel',label:'Combustível',validation:{required:true},values:[{code:'diesel',label:'Diesel'}]}]}],
 };
 let seq=1;
 const q=(table)=>{
  const f=[];let op='select',patch=null,lim=Infinity;
  const rows=()=>t[table].filter(r=>f.every(fn=>fn(r)));
  const shape=(r)=>table==='cars'?{...r,car_media:t.car_media.filter(m=>m.car_id===r.id)}:r;
  const run=()=>{
   if(op==='update'){const rs=rows();rs.forEach(r=>Object.assign(r,patch));return {data:rs,error:null};}
   if(op==='delete'){const keep=t[table].filter(r=>!f.every(fn=>fn(r)));const n=t[table].length-keep.length;t[table]=keep;return {data:n,error:null};}
   return {data:rows().slice(0,lim).map(shape),error:null};
  };
  const api={
   select(){return api;},eq(c,v){f.push(r=>r[c]===v);return api;},in(c,v){f.push(r=>v.includes(r[c]));return api;},
   lt(c,v){f.push(r=>r[c]<v);return api;},not(c,_o,_v){f.push(r=>r[c]!==null&&r[c]!==undefined);return api;},
   limit(n){lim=n;return api;},
   update(p){op='update';patch=p;return api;},delete(){op='delete';return api;},
   insert(row){t[table].push({id:`l${seq++}`,sync_state:'idle',attempts:0,status:'pending',external_id:null,external_url:null,
    remote_status:null,last_error:null,published_at:null,last_synced_at:null,...row});return Promise.resolve({data:null,error:null});},
   upsert(row){const i=t[table].findIndex(r=>r.vehicle_type===row.vehicle_type);if(i>=0)t[table][i]={...t[table][i],...row};else t[table].push(row);return Promise.resolve({error:null});},
   async maybeSingle(){return {data:run().data[0]??null,error:null};},
   then(res,rej){return Promise.resolve(run()).then(res,rej);},
  };
  return api;
 };
 return {from:q,_t:t};
}

// ---- Carregador com os módulos de servidor substituídos ---------------------
const cache=new Map();
function withExt(base){for(const ext of ['.ts','.tsx','/index.ts'])if(existsSync(base+ext))return base+ext;throw new Error(`não resolvido: ${base}`);}
const STUBS={
 'server-only':{},
 '@/lib/queries':{getBranding:async()=>({companyName:'engineLine',company:{phone:'+351 916 193 337',geo:{lat:41.2,lng:-8.28}}})},
};
function load(path){
 if(cache.has(path))return cache.get(path);
 const {outputText}=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 const mod={exports:{}};cache.set(path,mod.exports);
 const r=(id)=>id in STUBS?STUBS[id]:id.startsWith('@/')?load(withExt(`src/${id.slice(2)}`)):id.startsWith('.')?load(withExt(new URL(id,new URL(path,'file:///')).pathname.slice(1))):require(id);
 new Function('module','exports','require',outputText)(mod,mod.exports,r);
 cache.set(path,mod.exports);return mod.exports;}
const {markPending,syncListing}=load('src/lib/olx/sync.ts');

const listing=(db)=>db._t.channel_listings.find(l=>l.channel==='olx');

await test('a published car with OLX ticked becomes an OLX advert',async()=>{
 const db=makeDb();
 await markPending(db,CAR);
 assert.equal(listing(db).sync_state,'pending');
 const r=await syncListing(db,CAR);
 assert.equal(r.ok,true,r.error);assert.equal(r.action,'create');
 const l=listing(db);
 assert.equal(l.sync_state,'idle');assert.equal(l.remote_status,'active');assert.equal(l.status,'published');
 assert.match(l.external_url,/olx\.pt/);
 const ad=olx.adverts.get(Number(l.external_id));
 assert.equal(ad.external_id,CAR);assert.equal(ad.price.value,18500);
 assert.deepEqual(ad.images,[{url:'https://proj.supabase.co/storage/v1/object/public/car-media/bmw/1.jpg'}]);
 assert.equal(ad.contact.phone,'+351916193337');assert.equal(ad.location.city_id,17);
 assert.match(ad.title,/^BMW 320d 2018/,'a marca na grafia certa');
});

await test('changes update the advert; selling takes it down',async()=>{
 const db=makeDb();await markPending(db,CAR);await syncListing(db,CAR);
 const id=Number(listing(db).external_id);
 db._t.cars[0].price=17900;
 await markPending(db,CAR);assert.equal((await syncListing(db,CAR)).action,'update');
 assert.equal(olx.adverts.get(id).price.value,17900);
 db._t.cars[0].status='sold';
 await markPending(db,CAR);assert.equal((await syncListing(db,CAR)).action,'deactivate_sold');
 assert.equal(olx.adverts.get(id).status,'removed_by_user');assert.equal(olx.adverts.get(id).sold,true,'vendida, para o OLX');
 assert.equal(listing(db).status,'removed');
 // Volta a publicar: reativa o MESMO anúncio.
 db._t.cars[0].status='published';
 await markPending(db,CAR);assert.equal((await syncListing(db,CAR)).action,'update_and_activate');
 assert.equal(olx.adverts.get(id).status,'active');
});

await test('a retry never duplicates the advert',async()=>{
 const db=makeDb();await markPending(db,CAR);await syncListing(db,CAR);
 const antes=[...olx.adverts.values()].filter(a=>a.external_id===CAR).length;
 // A resposta da criação "perdeu-se": o site esqueceu o id, mas o OLX tem-no.
 Object.assign(listing(db),{external_id:null,remote_status:null});
 await markPending(db,CAR);await syncListing(db,CAR);
 assert.equal([...olx.adverts.values()].filter(a=>a.external_id===CAR).length,antes,'encontrado pelo external_id');
});

await test('an expired token is renewed and the new refresh token is kept',async()=>{
 const db=makeDb();
 db._t.olx_connection[0].expires_at=new Date(Date.now()-1000).toISOString();
 await markPending(db,CAR);const r=await syncListing(db,CAR);
 assert.equal(r.ok,true,r.error);
 assert.equal(db._t.olx_connection[0].refresh_token,olx.refresh,'guardou o refresh token novo');
 // Um 401 a meio (token revogado): renova e repete.
 olx.expireNext=true;db._t.cars[0].price=17000;
 await markPending(db,CAR);assert.equal((await syncListing(db,CAR)).ok,true);
});

await test('OLX refusals and unpublishable cars reach the backoffice in Portuguese',async()=>{
 const db=makeDb();
 db._t.cars[0].price_on_request=true;db._t.cars[0].price=null;
 const antes=olx.calls.length;
 await markPending(db,CAR);const r=await syncListing(db,CAR);
 assert.equal(r.ok,false);assert.equal(listing(db).sync_state,'error');
 assert.equal(olx.calls.slice(antes).some(c=>c==='POST /api/partner/adverts'),false,'nem chegou a enviar ao OLX');
 assert.match(listing(db).last_error,/preço/);

 const db2=makeDb();
 olx.rejectNext={error:{status:400,title:'Invalid request',detail:'Data validation error occurred',validation:[{field:'title',title:'Too many capital letters'}]}};
 // Garante que não é encontrado por external_id de testes anteriores.
 db2._t.cars[0].id='22222222-2222-4222-8222-222222222222';db2._t.car_media[0].car_id=db2._t.cars[0].id;
 await markPending(db2,db2._t.cars[0].id);const r2=await syncListing(db2,db2._t.cars[0].id);
 assert.equal(r2.ok,false);assert.match(listing(db2).last_error,/title: Too many capital letters/);
 assert.equal(listing(db2).attempts,1,'conta para as tentativas automáticas');
});

await test('unticking OLX retires the advert; nothing happens without it',async()=>{
 const db=makeDb();await markPending(db,CAR);await syncListing(db,CAR);
 const id=Number(listing(db).external_id);
 db._t.cars[0].channels=[];
 await markPending(db,CAR);assert.equal((await syncListing(db,CAR)).action,'deactivate');
 assert.equal(olx.adverts.get(id).sold,false,'retirada, não vendida');
 const limpo=makeDb();limpo._t.cars[0].channels=[];
 await markPending(limpo,CAR);assert.equal(limpo._t.channel_listings.length,0,'sem OLX e sem anúncio, nem cria linha');
});

server.close();
