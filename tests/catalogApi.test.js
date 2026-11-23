import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SourceTextModule, SyntheticModule } from 'node:vm';

async function apiWith(transport) {
  const api = new SourceTextModule(await readFile(new URL('../src/api/catalogApi.js', import.meta.url), 'utf8'));
  await api.link(() => new SyntheticModule(['httpClient'], function () { this.setExport('httpClient', transport); }));
  await api.evaluate();
  return api.namespace;
}
const product = {id:'product',name:'Whey',version:2,images:[{id:'photo'}],availability:'DISPONIBLE',published:true};
const promotion = {id:'offer',version:2,supplement:product,state:'VIGENTE',enabled:true};
const response = data => ({ok:true,json:async()=>data});

test('catalog rejects null and incomplete lists instead of treating them as empty', async()=>{
  for(const data of [null,{}, {content:[]}, {content:[{}],totalElements:1,totalPages:1}]) {
    const api=await apiWith(async()=>response(data));
    await assert.rejects(api.listSupplements({},'token'),/confirmar la lista/);
  }
});
test('catalog accepts real empty pages and encodes filters without losing false or zero',async()=>{
  let path;
  const api=await apiWith(async url=>{path=url;return response({content:[],totalElements:0,totalPages:0});});
  assert.deepEqual(await api.listSupplements({query:'Marca & sabor',published:false,page:0},'token'),{content:[],totalElements:0,totalPages:0});
  const q=new URLSearchParams(path.split('?')[1]);
  assert.equal(q.get('query'),'Marca & sabor');assert.equal(q.get('published'),'false');assert.equal(q.get('page'),'0');
});
test('commercial catalog uses the mobile endpoint and joins every page without duplicates',async()=>{
  const calls=[];
  const row=id=>({id,name:`Producto ${id}`,pricePen:150,availability:'DISPONIBLE',offer:id==='a'?{id:'offer-a',pricePen:120}:null});
  const api=await apiWith(async url=>{
    calls.push(url);
    const page=new URLSearchParams(url.split('?')[1]).get('page');
    return response(page==='0'?[row('a'),row('b')]:[row('b')]);
  });
  const products=await api.listCatalogProducts('token',2);
  assert.deepEqual(products.map(item=>item.id),['a','b']);
  assert.match(calls[0],/\/api\/v1\/catalog\/products\?page=0&size=2$/);
  assert.match(calls[1],/\/api\/v1\/catalog\/products\?page=1&size=2$/);
});
test('commercial catalog rejects malformed mobile products',async()=>{
  const api=await apiWith(async()=>response([{id:'incomplete'}]));
  await assert.rejects(api.listCatalogProducts('token'),/catálogo comercial incompleto/);
});
test('details reject a response for another product or promotion',async()=>{
  const api=await apiWith(async()=>response(product));
  await assert.rejects(api.getSupplement('other','token'),/otro registro/);
  const offers=await apiWith(async()=>response(promotion));
  await assert.rejects(offers.getPromotion('other','token'),/otro registro/);
});
test('state update cannot announce success for an unchanged version or wrong state',async()=>{
  for(const saved of [null,product,{...product,version:3,availability:'AGOTADO'}]) {
    const api=await apiWith(async()=>response(saved));
    await assert.rejects(api.updateSupplementState(product,{availability:'DISPONIBLE',published:false},'token'),/confirmar el estado/);
  }
});
test('state update carries optimistic version and confirms persisted values',async()=>{
  let sent;
  const api=await apiWith(async(_url,opts)=>{sent=JSON.parse(opts.body);return response({...product,version:3,published:false});});
  await api.updateSupplementState(product,{availability:'DISPONIBLE',published:false},'token');
  assert.equal(sent.version,2);
});
test('promotion save rejects another product and stale versions',async()=>{
  for(const saved of [null,promotion,{...promotion,version:3,supplement:{...product,id:'other'}}]) {
    const api=await apiWith(async()=>response(saved));
    await assert.rejects(api.savePromotion(promotion,{supplementId:product.id,offerPricePen:'135.00'},'token'),/confirmar el guardado/);
  }
});
test('deactivation requires a newer persisted version and disabled state',async()=>{
  for(const saved of [null,{...promotion,enabled:false}, {...promotion,version:3}]) {
    const api=await apiWith(async()=>response(saved));
    await assert.rejects(api.deactivatePromotion(promotion,'token'),/confirmar la desactivación/);
  }
  const api=await apiWith(async()=>response({...promotion,version:3,enabled:false,state:'CANCELADA'}));
  assert.equal((await api.deactivatePromotion(promotion,'token')).enabled,false);
});
test('HTTP conflict remains recoverable even when the server returns null',async()=>{
  const api=await apiWith(async()=>({ok:false,status:409,json:async()=>null}));
  await assert.rejects(api.getSupplement('product','token'),e=>e.status===409);
});
test('network and truncated JSON never become successful catalog operations',async()=>{
  for(const transport of [async()=>{throw new Error('Sin conexión');},async()=>({ok:true,json:async()=>{throw new Error('JSON');}})]) {
    const api=await apiWith(transport);
    await assert.rejects(api.listPromotions({},'token'));
  }
});

test('supplement edit preserves multipart images and rejects another record',async()=>{
  let body;
  const api=await apiWith(async(_url,opts)=>{body=opts.body;return response({...product,version:3});});
  await api.saveSupplement(product,{pricePen:'150.00'},[{id:'photo'}],'token');
  const data=JSON.parse(await body.get('data').text());
  assert.equal(data.version,2);assert.equal(data.pricePen,150);
  assert.deepEqual(data.keepImageIds,['photo']);assert.equal(data.primaryImageKey,'photo');
  const wrong=await apiWith(async()=>response({...product,id:'other',version:3}));
  await assert.rejects(wrong.saveSupplement(product,{pricePen:'150.00'},[{id:'photo'}],'token'),/guardado completo/);
});
test('corrupt history is rejected before React renders JSON snapshots',async()=>{
  for(const rows of [null,[{version:1,snapshot:'{'}],[{version:1,snapshot:'null'}]]) {
    const api=await apiWith(async()=>response(rows));
    await assert.rejects(api.supplementHistory('product',0,'token'),/historial/);
  }
  const rows=[{version:1,snapshot:JSON.stringify({name:'Whey',pricePen:150})}];
  const api=await apiWith(async()=>response(rows));
  assert.deepEqual(await api.promotionHistory('offer',0,'token'),rows);
});
