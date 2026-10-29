import test from 'node:test';
import assert from 'node:assert/strict';
import {validateState} from '../sync/protocol.mjs';
import {SyncClient} from '../sync-client.mjs';
test('Protocol accepts public state and rejects credentials, notes and oversized output',()=>{
 const state={presentationVersion:'1.0.0',slide:0,results:{'4-0':{command:'node test',text:'exit=1',status:'finished',source:'live',exitCode:1}}};
 assert.ok(validateState(state));
 assert.ok(!validateState({...state,publishToken:'secret'}));
 assert.ok(!validateState({...state,slide:17}));
 assert.ok(validateState({...state,slide:16}),'La nueva diapositiva final se puede compartir');
 assert.ok(!validateState({...state,results:{'4-0':{...state.results['4-0'],notes:'private'}}}));
 assert.ok(!validateState({...state,results:{'4-0':{...state.results['4-0'],text:'x'.repeat(16001)}}}));
 assert.throws(()=>new SyncClient({syncUrl:'http://public.example'}));
});
test('Recovery publishes the newest snapshot without rolling back to queued old slides',async()=>{
 const client=new SyncClient({syncUrl:'http://127.0.0.1:8790'});
 client.session={id:'TEST',publishToken:'FAKE'};
 let fail=true;const slides=[];
 client.request=async(_path,_method,_token,state)=>{if(fail){fail=false;throw Error('offline');}slides.push(state.slide);return {ok:true};};
 const state=slide=>({presentationVersion:'1.0.0',slide,results:{}});
 await client.publish(state(1));assert.match(client.error,/offline/);
 await Promise.all([client.publish(state(2)),client.publish(state(3))]);
 assert.deepEqual(slides,[3]);assert.equal(client.error,'');
 await client.retry();assert.deepEqual(slides,[3],'No redundant writes while connected');
});
