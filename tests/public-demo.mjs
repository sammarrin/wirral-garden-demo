import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=process.env.TEST_ORIGIN || 'http://127.0.0.1:3002';
const fixture=JSON.parse(readFileSync(new URL('../lib/public-demo.json',import.meta.url)));
const pages=['/demo','/demo/leads','/demo/quotes',...fixture.leads.map(l=>'/demo/leads/'+l.id),...fixture.quotes.map(q=>'/demo/quotes/'+q.id)];
for(const p of pages){const r=await fetch(base+p);assert.equal(r.status,200,p);const h=await r.text();assert.ok(h.includes('Read-only demo'));assert.ok(!/href="\/(?:api|dashboard|quotes)\//.test(h),p);assert.ok(!h.includes('<form'),p);assert.ok(!/Create quote|Save changes|Confirm reset|Finalise &amp; mark sent/.test(h),p);}
assert.ok((await (await fetch(base)).text()).includes('View business dashboard demo'));
assert.equal((await fetch(base+'/dashboard',{redirect:'manual'})).status,307);
for(const [p,method] of [['/api/leads/demo-1','PATCH'],['/api/leads/demo-1/quotes','POST'],['/api/quotes/sample-quote-1','PATCH'],['/api/quotes/sample-quote-1/finalise','POST'],['/api/demo/reset','POST'],['/api/photos/anything','GET']]){const r=await fetch(base+p,{method,headers:{Origin:base,'Content-Type':'application/json'},...(method==='GET'?{}:{body:'{}'})});assert.equal(r.status,401,p);}
assert.equal((await fetch(base+'/api/quotes/sample-quote-1/respond',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({decision:'Accepted'})})).status,404);
for(const p of ['/demo','/demo/leads/demo-1'])assert.equal((await fetch(base+p,{method:'POST'})).status,405);
assert.ok(fixture.quotes.every(q=>!q.token));
console.log('PASS 18 public demo pages; no mutation forms or live record links; real owner routes remain protected; sample quote responses rejected; demo POST rejected.');
