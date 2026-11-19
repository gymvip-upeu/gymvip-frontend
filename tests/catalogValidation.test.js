import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSupplement,validatePromotion,updatedLabel } from '../src/components/catalog/catalogUtils.js';
const product={name:'Whey',brand:'Demo',category:'PROTEINA',presentation:'Pote',netContent:'900 g',description:'Rotulado',pricePen:'150.00'};
test('supplements reject non-finite, non-positive and over-precision prices and require an image',()=>{
  assert.deepEqual(validateSupplement(product,[{}]),{});
  for(const pricePen of ['0','-1','Infinity','1.001','']) assert.ok(validateSupplement({...product,pricePen},[{}]).pricePen);
  assert.ok(validateSupplement(product,[]).images);
});

test('catalog validates category and real calendar dates, including leap years',()=>{
  assert.ok(validateSupplement({...product,category:'INVALIDA'},[{}]).category);
  const p={name:'Oferta',supplementId:'id',description:'Oferta',conditions:'Condiciones',offerPricePen:'135',startDate:'2026-02-28',endDate:'2026-03-01'};
  assert.deepEqual(validatePromotion(p,150),{});
  assert.ok(validatePromotion({...p,startDate:'2026-02-30'},150).startDate);
  assert.ok(validatePromotion({...p,endDate:'2026-02-29'},150).endDate);
  assert.deepEqual(validatePromotion({...p,startDate:'2028-02-28',endDate:'2028-02-29'},150),{});
  assert.ok(validatePromotion(p,undefined).supplementId);
});
test('UTC and offset timestamps render the same Lima update time',()=>{
  assert.equal(updatedLabel('2026-11-19T15:00:00'),updatedLabel('2026-11-19T15:00:00Z'));
  assert.equal(updatedLabel('2026-11-19T15:00:00Z'),updatedLabel('2026-11-19T10:00:00-05:00'));
});
test('promotions require a positive discount and an end date after the start',()=>{
  const promotion={name:'Oferta',supplementId:'demo',description:'Descuento',conditions:'No acumulable',offerPricePen:'135.00',startDate:'2026-11-01',endDate:'2026-11-15'};
  assert.deepEqual(validatePromotion(promotion,150),{});
  assert.ok(validatePromotion({...promotion,endDate:'2026-11-01'},150).endDate);
  assert.ok(validatePromotion({...promotion,endDate:'2026-10-31'},150).endDate);
  assert.ok(validatePromotion({...promotion,offerPricePen:'150.00'},150).offerPricePen);
  assert.ok(validatePromotion({...promotion,offerPricePen:'Infinity'},150).offerPricePen);
});

