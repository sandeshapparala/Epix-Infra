require('./theater-test-loader.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PDFDocument, PDFName, PDFRawStream } = require('pdf-lib');
const products = require('../src/data/theater/products.json');
const { DEFAULT_DESIGN, parseSavedDesign } = require('../src/components/theater-builder/design.ts');
const { applyTV, applyProjector, activeSlots, calculateQuote, compatibility } = require('../src/lib/theater/quote.ts');
const { visualDesign } = require('../src/lib/theater/visual-design.ts');
const { parseProject } = require('../src/lib/theater/validation.ts');
const { EMPTY_CUSTOMER, EMPTY_EQUIPMENT } = require('../src/lib/theater/types.ts');
const { filterPricingProducts } = require('../src/lib/theater/pricing-filters.ts');
const find = id => { const p=products.find(p=>p.id===id); assert.ok(p,id); return p; };
const state = () => ({design:{...DEFAULT_DESIGN},equipment:structuredClone(EMPTY_EQUIPMENT),customer:{...EMPTY_CUSTOMER},services:[],discountPercent:0,validityDays:15,terms:'',exclusions:''});

test('source lists and BenQ screenshot updates add 83 models and preserve original/Series 2 Marantz identities', () => {
  assert.equal(products.filter(p=>p.brand==='Marantz').length,58);
  assert.equal(products.filter(p=>p.brand==='Sony').length,36);
  assert.equal(products.filter(p=>p.brand==='BenQ').length,7);
  const old=find('marantz-cinema-50'), newer=find('marantz-cinema-50-series-2');
  assert.equal(old.price.amountPaise,29990000);
  assert.equal(newer.price.amountPaise,31490000);
  assert.equal(old.source.effectiveDate,'2026-07-01');
  assert.equal(newer.source.effectiveDate,'2026-10-01');
  assert.equal(find('marantz-cinema-60').price.amountPaise,23190000);
  assert.equal(find('marantz-cinema-60-series-2').price.amountPaise,24490000);
  assert.equal(find('marantz-amp30').price.amountPaise,54900000);
  assert.equal(find('marantz-av-10').price.amountPaise,126400000);
});

test('all thirteen supplied root price lists are recorded and the remaining brand imports preserve newer Marantz prices', () => {
  const sources=require('../src/data/theater/sources.json');
  const expected={'Rotel':34,'Focal':69,'Sonus faber':90,'Marantz':58};
  for(const [brand,count] of Object.entries(expected))assert.equal(products.filter(p=>p.brand===brand).length,count,brand);
  assert.equal(sources.length,21);
  const remaining=require('../src/data/theater/remaining-catalog-evidence.json');
  assert.equal(remaining.length,4);
  assert.deepEqual(remaining.map(x=>x.rows.length),[34,69,195,35]);
  for(const source of remaining)assert.ok(sources.some(x=>x.file===source.file&&x.sha256===source.sha256));
  assert.equal(find('marantz-mm-7025').price.amountPaise,12990000);
  assert.equal(find('marantz-cinema-50').source.effectiveDate,'2026-07-01');
  assert.equal(find('marantz-av7706').source.effectiveDate,'2023-06-01');
  assert.equal(find('marantz-tt5005').price.amountPaise,3990000);
  for(const p of products.filter(p=>remaining.some(x=>x.file===p.source.file))){
    assert.ok(fs.existsSync('public'+p.image),p.id);
    assert.ok(fs.existsSync('public'+p.quoteImage),p.id);
    assert.ok(p.imageSource,p.id);
    assert.equal(p.price.taxBasis,'inclusive');
    assert.equal(p.price.gstRate,0);
    assert.ok(!/[•\ufffd]/.test(p.model),p.model);
  }
});

test('remaining models retain correct selling packs, categories, distinct variants and explicit source conflicts', () => {
  assert.equal(find('rotel-c8').price.amountPaise,25190000);
  assert.equal(find('rotel-c8-plus').price.amountPaise,32590000);
  assert.equal(find('rotel-rsp-1576mkii').specs.processedChannels,11);
  assert.equal(find('rotel-rmb-1585').specs.amplifiedChannels,5);
  assert.deepEqual(find('rotel-x5').roles,['extra']);
  assert.equal(find('sonus-faber-concertino-standard-edition').category,'bookshelf');
  assert.equal(find('sonus-faber-sonetto-g2-viii').category,'floorstanding');
  assert.equal(find('sonus-faber-gravis-iii').category,'subwoofer');
  assert.equal(find('sonus-faber-pc-662').category,'ceiling');
  assert.equal(find('focal-aria-k2-936').price.packSize,2);
  assert.equal(find('focal-aria-k2-center').price.packSize,1);
  assert.equal(find('focal-100-iw-sub8-amplifier').roles.includes('amplifier'),false);
  for(const name of ['kit320fin','kit321fin']){
    const p=find('sonus-faber-palladio-square-grille-kit-'+name);
    assert.equal(p.price.amountPaise,null);
    assert.equal(p.price.packSize,10);
    assert.ok(p.issues.some(x=>/different prices/.test(x)));
  }
  assert.ok(find('sonus-faber-arena-20').issues.some(x=>/repeats DIF393FIN/.test(x)));
  const settings={search:'',brand:'Sonus faber',type:'speakers',category:'ceiling',pending:false};
  assert.equal(filterPricingProducts(products,settings).length,9);
});

test('actual Rotel products and electronics bundles cannot exceed ten percent for admins or employees', () => {
  const {requireItemDiscounts}=require('../src/lib/theater/access.ts');
  const admin={uid:'admin',role:'admin',active:true,maxDiscountPercent:100};
  const employee={uid:'employee',role:'employee',active:true,maxDiscountPercent:20};
  const s=state();s.discountPercent=20;
  const processor=find('rotel-rsp-1576mkii');
  const bundle=find('rotel-7-1-4-amplification-package-1585');
  s.equipment.slots.receiver={productId:processor.id,finish:''};
  s.equipment.extras=[{productId:bundle.id,finish:'',quantity:1}];
  const q=calculateQuote(s,products);
  for(const p of [processor,bundle]){
    const line=q.lines.find(l=>l.productId===p.id);
    assert.equal(line.discountPercent,10);
    assert.equal(line.totalPaise,Math.round(p.price.amountPaise*.9));
    s.lineDiscounts={[p.id+'|']:10};
    assert.doesNotThrow(()=>requireItemDiscounts(admin,s,products));
    assert.doesNotThrow(()=>requireItemDiscounts(employee,s,products));
    s.lineDiscounts[p.id+'|']=10.01;
    assert.throws(()=>requireItemDiscounts(admin,s,products),/maximum allowed discount is 10%/);
    assert.throws(()=>requireItemDiscounts(employee,s,products),/maximum allowed discount is 10%/);
  }
  assert.equal(bundle.category,'electronics-package');
  assert.ok(q.missing.some(x=>/Front left/.test(x)),'an amplification bundle cannot silently supply speakers');
  s.equipment.extras=[];s.equipment.slots.receiver={productId:bundle.id,finish:''};s.lineDiscounts={};
  const bundleQuote=calculateQuote(s,products);
  assert.ok(!bundleQuote.missing.includes('Additional power amplifier'));
  assert.ok(bundleQuote.missing.some(x=>/Front left/.test(x)));
});

test('BenQ brochure specifications drive fixed/zoom throw tracks without inventing prices or tax', () => {
  const expected={w2720i:[2500,1,1.3],w4100i:[3200,1.15,1.5],gp520:[2600,1.2,1.2],tk705i:[3000,1,1.3],tk705sti:[3000,.8,.8]};
  for(const [model,values] of Object.entries(expected)) {
    const p=find('benq-'+model),d=applyProjector(DEFAULT_DESIGN,p);
    assert.deepEqual([d.lumens,d.throwMin,d.throwMax],values);
    assert.equal(p.price.amountPaise,model==='tk705i'?21999000:model==='tk705sti'?23500000:null);
    assert.equal(p.price.gstRate,['tk705i','tk705sti'].includes(model)?0:null);
    assert.equal(p.price.taxBasis,['tk705i','tk705sti'].includes(model)?'inclusive':'unknown');
    assert.doesNotThrow(()=>parseSavedDesign(JSON.stringify({version:1,design:d})));
  }
  const high=applyProjector(DEFAULT_DESIGN,find('sony-vpl-fhz101l'));
  assert.equal(high.lumens,10000);
  assert.doesNotThrow(()=>parseSavedDesign(JSON.stringify({version:1,design:high})));
  assert.equal(find('sony-vpl-fhz101l').specs.throwMin,undefined);
});

test('catalog displays set and retain their real 43–98 inch size and remain separate from projectors', () => {
  const s=state();const tv=find('sony-fw-43ez20l');
  s.equipment.slots.tv={productId:tv.id,finish:''};
  s.design=applyTV(s.design,tv);
  assert.equal(s.design.diagonal,43);
  assert.equal(s.design.display,'tv');
  assert.equal(s.design.aspect,'16:9');
  assert.doesNotThrow(()=>parseProject(s));
  assert.ok(activeSlots(s,products).includes('tv'));
  assert.ok(!activeSlots(s,products).includes('projector'));
  assert.equal(visualDesign({...s.design,diagonal:120},s.equipment,products).diagonal,43);
  assert.ok(compatibility(tv,'tv',{...s,design:{...s.design,diagonal:120}}).some(i=>i.level==='error'));
  const q=calculateQuote(s,products);
  assert.ok(q.lines.some(l=>l.productId===tv.id));
  assert.ok(!q.missing.some(m=>/TV price|professional display/.test(m)));
  assert.equal(q.lines.find(l=>l.productId===tv.id).pending.length, 0);
  s.design={...DEFAULT_DESIGN};
  assert.ok(!calculateQuote(s,products).lines.some(l=>l.productId===tv.id));
});

test('legacy display scope lines still work without a catalog TV', () => {
  const s=state();s.design.display='tv';
  s.services=[{id:'display',category:'display',description:'Custom television',quantity:1,amountPaise:100000,gstRate:18}];
  assert.ok(!calculateQuote(s,products).missing.some(m=>/TV price|professional display/.test(m)));
});

test('Marantz processors require enough real power-amplifier channels; stereo gear stays in extras', () => {
  const s=state();
  s.equipment.slots.receiver={productId:find('marantz-av30').id,finish:''};
  s.equipment.slots.amplifier={productId:find('marantz-amp30').id,finish:''};
  assert.ok(calculateQuote(s,products).issues.some(i=>i.level==='error'&&/provides 6/.test(i.text)));
  s.equipment.slots.amplifier.productId='marantz-amp-20';
  assert.ok(!calculateQuote(s,products).issues.some(i=>i.level==='error'&&/power-amplifier channels/.test(i.text)));
  assert.deepEqual(find('marantz-model-m4').roles,['extra']);
  assert.deepEqual(find('marantz-stereo-70s').roles,['extra']);
  assert.deepEqual(find('marantz-model-70').roles,['extra']);
});

test('new models appear in company/type/category filters and all images have a source', () => {
  const defaults={brand:'Sony',search:'',type:'displays',category:'professional-display',pending:false};
  assert.equal(filterPricingProducts(products,defaults).length,20);
  for(const p of products.filter(p=>['Sony','Marantz','BenQ'].includes(p.brand))) {
    assert.ok(p.imageSource,p.id);
    assert.ok(fs.existsSync('public'+p.image),p.id);
    assert.ok(fs.existsSync('public'+p.quoteImage),p.id);
    assert.equal(p.price.gstRate,p.source.effectiveDate==='2023-06-01'||p.brand==='BenQ'&&p.price.amountPaise!==null?0:null,p.id);
  }
  assert.equal(find('sony-zm2810-1y').category,'accessory');
  assert.equal(find('sony-wq-bs1').imageKind,'service');
  assert.equal(find('sony-zm2810-1y').price.unit,'unknown');
});

test('illustrated quotation PDFs embed the new display, processor, amplifier and projector images without changing prices', async () => {
  const { sampleQuote } = require('./theater-quotation-fixture.cjs');
  const { quotationPdf } = require('../src/lib/theater/pdf.ts');
  for(const display of ['tv','projector']) {
    const q=sampleQuote();
    const slots=q.state.equipment.slots;
    slots.receiver={productId:'marantz-av30',finish:''};
    slots.amplifier={productId:'marantz-amp-20',finish:''};
    slots.tv={productId:'sony-fw-65bz40l',finish:''};
    slots.projector={productId:'benq-w2720i',finish:''};
    q.state.design=display==='tv' ? applyTV(q.state.design,find(slots.tv.productId)) : applyProjector(q.state.design,find(slots.projector.productId));
    q.state.services=q.state.services.filter(s=>display==='projector'||s.category!=='screen');
    const ids=Object.values(slots).map(s=>s.productId);
    q.products=products.filter(p=>ids.includes(p.id));
    q.calculation=calculateQuote(q.state,q.products);
    const before=JSON.stringify(q);
    const bytes=await quotationPdf(q);
    assert.equal(JSON.stringify(q),before);
    assert.ok(bytes.length>20000);
    const doc=await PDFDocument.load(bytes);
    const images=doc.context.enumerateIndirectObjects().filter(([,obj])=>obj instanceof PDFRawStream && obj.dict.get(PDFName.of('Subtype'))?.toString()==='/Image');
    assert.ok(images.length>=q.calculation.lines.filter(l=>l.productId).length);
    assert.ok(doc.getPageCount()>=2);
    assert.ok(q.calculation.lines.some(l=>l.productId===(display==='tv'?slots.tv.productId:slots.projector.productId)));
  }
});
const suppliedBenq = require('../src/data/theater/benq-price-updates-2026-10.json');
test('the supplied BenQ screenshot prices use exact models, official lens data and separate local photos', () => {
  for(const entry of suppliedBenq.items) {
    const p=find(entry.id);
    assert.equal(p.price.amountPaise,entry.amountInr*100);
    assert.equal(p.source.sha256,suppliedBenq.sources[entry.source].sha256);
    assert.deepEqual([p.specs.throwMin,p.specs.throwMax],[entry.specs.throwMin,entry.specs.throwMax]);
    assert.ok(p.imageSource.startsWith('https://www.benq.com/'));
  }
  assert.equal(find('benq-tk710').price.amountPaise,25999000);
  assert.equal(find('benq-tk710sti').price.amountPaise,29999000);
  assert.notEqual(find('benq-tk710').quoteImage,find('benq-tk710sti').quoteImage);
});
