import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const db = new PGlite();
await db.exec(`
 create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create schema storage;
 create table auth.users(id uuid primary key, email text,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create table storage.buckets(id text primary key,name text,public boolean);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 grant usage on schema public,auth,storage to anon,authenticated,service_role;
 alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
 alter default privileges in schema public grant usage,select on sequences to anon,authenticated,service_role;
 grant all on storage.objects to anon,authenticated,service_role;
`);
for(const file of (await readdir('supabase/migrations')).sort()) {
 // gen_random_uuid is built into this PostgreSQL; pgcrypto itself is not needed.
 const sql=(await readFile(`supabase/migrations/${file}`,'utf8')).replace('create extension if not exists "pgcrypto";','');
 await db.exec(sql);
}
const admin='00000000-0000-4000-8000-000000000001';
const seller='00000000-0000-4000-8000-000000000002';
const mechanic='00000000-0000-4000-8000-000000000003';
const limited='00000000-0000-4000-8000-000000000004';
for(const [id,role]of[[admin,'admin'],[seller,'vendedor'],[mechanic,'mecanico'],[limited,'vendedor']]) {
 await db.query('insert into auth.users(id,email) values($1,$2)',[id,`${role}-${id}@example.test`]);
 await db.query('insert into public.profiles(id,role) values($1,$2)',[id,role]);
}
await db.query("update public.profiles set allowed_sections=array['dashboard'] where id=$1",[limited]);
const car=(await db.query(`insert into cars(slug,make,model,year,fuel,transmission,body,status,price) values('test-car','BMW','320',2020,'Diesel','Manual','Berlina','published',25000) returning id`)).rows[0].id;
const car2=(await db.query(`insert into cars(slug,make,model,year,fuel,transmission,body,status,price) values('test-car-2','BMW','330',2021,'Diesel','Manual','Berlina','published',35000) returning id`)).rows[0].id;
const lead=(await db.query("insert into leads(car_id,name,email) values($1,'Cliente','client@example.test') returning id",[car])).rows[0].id;
const lead2=(await db.query("insert into leads(car_id,name,email) values($1,'Cliente 2','client2@example.test') returning id",[car])).rows[0].id;
async function asUser(id,fn,role='authenticated') {
 await db.exec(`set role ${role}`);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id??'']);
 try{return await fn();}finally{await db.exec('reset role');await db.exec("select set_config('request.jwt.claim.sub','',false)");}
}
await test('anonymous registrations cannot create staff or trust role metadata',async()=>{
 const id='00000000-0000-4000-8000-000000000099';
 await db.query(`insert into auth.users(id,raw_user_meta_data) values($1,'{"role":"admin"}')`,[id]);
 assert.equal((await db.query('select * from profiles where id=$1',[id])).rows.length,0);
});
await test('seller cannot promote self, but can edit own name',async()=>asUser(seller,async()=>{
 await assert.rejects(db.query("update profiles set role='admin' where id=$1",[seller]),/permission denied/);
 await db.query("update profiles set full_name='Vendedor' where id=$1",[seller]);
 await assert.rejects(db.query("update profiles set allowed_sections=array['financeiro'] where id=$1",[seller]),/permission denied/);
}));
await test('mechanic and limited seller cannot read leads or modify cars through SQL/API',async()=>{
 for(const id of [mechanic,limited])await asUser(id,async()=>{
  assert.equal((await db.query('select * from leads')).rows.length,0);
  assert.equal((await db.query('update cars set price=1 where id=$1 returning id',[car])).rows.length,0);
  await assert.rejects(db.query("insert into leads(name,email) values('bad','bad@example.test')"),/row-level security/);
 });
});
await test('public submissions cannot bypass server validation via direct API',async()=>asUser(null,async()=>{
 await assert.rejects(db.query("insert into leads(name,email) values('spam','spam@example.test')"),/row-level security/);
 await assert.rejects(db.query('insert into car_views(car_id) values($1)',[car]),/row-level security/);
 await assert.rejects(db.query("insert into testimonials(name,body,published) values('spam','spam',false)"),/row-level security/);
 await assert.rejects(db.query("select consume_submission('x',10,600)"),/permission denied/);
},'anon'));
await test('financial data cannot be read by public, seller or mechanic',async()=>{
 await db.query('insert into vehicle_financials(car_id,purchase_price) values($1,17000)',[car]);
 for(const[id,role]of[[null,'anon'],[seller,'authenticated'],[mechanic,'authenticated']])await asUser(id,async()=>assert.equal((await db.query('select * from vehicle_financials')).rows.length,0),role);
});
await test('workshop intake has unknown specs and cannot be published prematurely',async()=>{
 const id=await asUser(mechanic,async()=>(await db.query("select create_workshop_intake('BMW por identificar','AA-00-AA') id")).rows[0].id);
 const row=(await db.query('select * from cars where id=$1',[id])).rows[0];
 assert.equal(row.fuel,null);assert.equal(row.transmission,null);assert.equal(row.year,null);assert.equal(row.status,'draft');
 await asUser(admin,async()=>assert.rejects(db.query("update cars set status='published' where id=$1",[id]),/complete_public_car/));
});
await test('workshop hours are recalculated even when API submits forged totals',async()=>asUser(mechanic,async()=>{
 const row=(await db.query("insert into vehicle_tasks(car_id,work_date,start_time,end_time,hours) values($1,current_date,'22:00','01:30',999) returning *",[car])).rows[0];
 assert.equal(Number(row.hours),3.5);
 const open=(await db.query("insert into vehicle_tasks(car_id,start_time) values($1,'10:00') returning id",[car])).rows[0].id;
 const done=(await db.query("update vehicle_tasks set end_time='11:30' where id=$1 returning hours",[open])).rows[0];
 assert.equal(Number(done.hours),1.5);
}));
await test('reservation blocks duplicate reservation, unrelated sale and direct status edits',async()=>asUser(admin,async()=>{
 await db.query("select reserve_vehicle($1,now()+interval '1 day',500)",[lead]);
 await assert.rejects(db.query("select reserve_vehicle($1,now()+interval '1 day',500)",[lead2]),/disponível/);
 await assert.rejects(db.query("select close_vehicle_sale($1,25000,current_date)",[lead2]),/outro contacto/);
 await assert.rejects(db.query("update cars set status='published' where id=$1",[car]),/Termine a reserva/);
 assert.equal((await db.query('select status from cars where id=$1',[car])).rows[0].status,'reserved');
}));
await test('closing a sale atomically links contact, vehicle, price and reservation',async()=>asUser(admin,async()=>{
 await db.query("select close_vehicle_sale($1,24500,current_date-1)",[lead]);
 assert.equal((await db.query('select status from leads where id=$1',[lead])).rows[0].status,'won');
 assert.equal((await db.query('select status from cars where id=$1',[car])).rows[0].status,'sold');
 assert.equal((await db.query('select sale_price from vehicle_financials where car_id=$1',[car])).rows[0].sale_price,'24500.00');
 assert.equal((await db.query("select status from reservations where lead_id=$1",[lead])).rows[0].status,'completed');
 assert.equal((await db.query('select sold_at::date=current_date-1 correct from cars where id=$1',[car])).rows[0].correct,true);
}));
await test('loss reason is mandatory and audit cannot be rewritten',async()=>asUser(seller,async()=>{
 await assert.rejects(db.query("update leads set status='lost' where id=$1",[lead2]),/motivo de perda/);
 await db.query("update leads set status='lost',loss_reason='Comprou outra viatura' where id=$1",[lead2]);
 assert.equal((await db.query('delete from audit_log returning id')).rows.length,0);
 assert.ok((await db.query("select * from audit_log where entity='leads'")).rows.length>0);
}));
await test('server-side submission quotas persist and reject excess attempts',async()=>asUser(null,async()=>{
 assert.equal((await db.query("select consume_submission('test',2,600) ok")).rows[0].ok,true);
 assert.equal((await db.query("select consume_submission('test',2,600) ok")).rows[0].ok,true);
 assert.equal((await db.query("select consume_submission('test',2,600) ok")).rows[0].ok,false);
},'service_role'));
await test('analytics aggregates more than 1000 views correctly',async()=>{
 await db.query('insert into car_views(car_id) select $1 from generate_series(1,1501)',[car2]);
 await asUser(admin,async()=>assert.equal((await db.query('select analytics_summary() s')).rows[0].s.views,1501));
});
await test('notification jobs are queued transactionally and claimed only once per lease',async()=>asUser(null,async()=>{
 const first=(await db.query('select * from claim_notification_jobs()')).rows;
 assert.ok(first.length>=2);assert.equal(first[0].attempts,1);
 assert.equal((await db.query('select * from claim_notification_jobs()')).rows.length,0);
},'service_role'));
await test('cancelled and expired reservations release availability',async()=>{
 const newLead=(await db.query("insert into leads(car_id,name,email) values($1,'Reserva','reserve@example.test') returning id",[car2])).rows[0].id;
 const reservation=await asUser(admin,async()=>(await db.query("select reserve_vehicle($1,now()+interval '1 day',0) id",[newLead])).rows[0].id);
 await asUser(admin,async()=>db.query('select release_reservation($1)',[reservation]));
 assert.equal((await db.query('select status from cars where id=$1',[car2])).rows[0].status,'published');
 const second=await asUser(admin,async()=>(await db.query("select reserve_vehicle($1,now()+interval '1 day',0) id",[newLead])).rows[0].id);
 await db.query("update reservations set expires_at=now()-interval '1 minute' where id=$1",[second]);
 await asUser(null,async()=>assert.equal((await db.query('select expire_reservations() n')).rows[0].n,1),'service_role');
 assert.equal((await db.query('select status from cars where id=$1',[car2])).rows[0].status,'published');
});
await test('sale cannot be attributed to a different contact through a direct update',async()=>asUser(seller,async()=>{
 await assert.rejects(db.query("update leads set status='won' where id=$1",[lead2]),/Conclua a venda/);
}));
await db.close();
