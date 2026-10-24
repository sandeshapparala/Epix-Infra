import test from 'node:test';

import assert from 'node:assert/strict';

import { DEFAULT_DESIGN, calculateDesign, parseSavedDesign, screenSize, solveSpeakers, constrainObjectMove, fitSeatingLayout, rowMotionBounds, seatingPosition, PRESETS, MIN_ROW_SPACING, SEATING_CLEARANCE } from '../src/components/theater-builder/design.ts';



test('120-inch 16:9 screen has correct metric dimensions and viewing angle', () => {

  const screen = screenSize(120, '16:9');

  assert.ok(Math.abs(screen.width - 2.65656) < 0.001);

  assert.ok(Math.abs(screen.height - 1.49432) < 0.001);

  const result = calculateDesign(DEFAULT_DESIGN);

  assert.equal(result.totalSeats, 6);

  assert.equal(result.speakerCount, 13);

  assert.equal(result.warnings.length, 0);

  assert.ok(result.angle > 41 && result.angle < 42);

});

test('fit checks detect independent width, rear clearance, screen and throw failures', () => {

  const result = calculateDesign({ ...DEFAULT_DESIGN, width: 3, depth: 4, seats: 5, rows: 3, diagonal: 180, throwMin: 3 });

  assert.ok(result.warnings.some(w => w.includes('room width')));

  assert.ok(result.warnings.some(w => w.includes('rear clearance')));

  assert.ok(result.warnings.some(w => w.includes('wall area')));

  assert.ok(result.warnings.some(w => w.includes('valid placement')));

});

test('brightness scales with inverse image area and gain; TV skips throw checks', () => {

  const small = calculateDesign({ ...DEFAULT_DESIGN, diagonal: 90 });

  const large = calculateDesign({ ...DEFAULT_DESIGN, diagonal: 180 });

  assert.ok(Math.abs(small.nits / large.nits - 4) < 0.001);

  assert.equal(calculateDesign({ ...DEFAULT_DESIGN, gain: 1.5 }).nits, calculateDesign(DEFAULT_DESIGN).nits * 1.5);

  assert.ok(!calculateDesign({ ...DEFAULT_DESIGN, display: 'tv', throwMin: 3, throwMax: 1 }).warnings.some(w => w.includes('projector')));

});

test('saved designs round-trip and reject corrupt, incompatible or unsafe values', () => {

  assert.deepEqual(parseSavedDesign(JSON.stringify({ version: 1, design: DEFAULT_DESIGN })), DEFAULT_DESIGN);

  for (const design of [{ ...DEFAULT_DESIGN, width: '8' }, { ...DEFAULT_DESIGN, seats: 2.5 }, { ...DEFAULT_DESIGN, finish: 'unknown' }, { ...DEFAULT_DESIGN, depth: -1 }]) {

    assert.throws(() => parseSavedDesign(JSON.stringify({ version: 1, design })));

  }

  assert.throws(() => parseSavedDesign('{broken'));

  assert.throws(() => parseSavedDesign(JSON.stringify({ version: 2, design: DEFAULT_DESIGN })));

});





test('speaker layouts have correct channels and symmetric positions at a centered seat', () => {

  for (const [audio, count] of [['5.1', 6], ['5.1.2', 8], ['7.2.4', 13]]) {

    const result = solveSpeakers({ ...DEFAULT_DESIGN, audio });

    assert.equal(result.speakers.length, count);

    assert.equal(new Set(result.speakers.map(s => s.id)).size, count);

    const l = result.speakers.find(s => s.id === 'L'), r = result.speakers.find(s => s.id === 'R');

    assert.ok(Math.abs(l.position[0] + r.position[0]) < 1e-9);

    assert.ok(Math.abs(l.distance - r.distance) < 1e-9);

    assert.ok(Math.abs(l.yaw + r.yaw) < 1e-9);

  }

});

test('moving primary seating only moves its side surrounds; all ceiling speakers stay fixed', () => {

  const before = solveSpeakers(DEFAULT_DESIGN);

  const after = solveSpeakers({ ...DEFAULT_DESIGN, distance: 4 });

  for (const id of ['SL', 'SR']) {

    assert.notDeepEqual(before.speakers.find(s => s.id === id).position, after.speakers.find(s => s.id === id).position);

  }

  for (const id of ['L', 'R', 'C', 'SBL', 'SBR', 'TFL', 'TFR', 'TRL', 'TRR', 'SUB1', 'SUB2']) {
    const previous = before.speakers.find(s => s.id === id), next = after.speakers.find(s => s.id === id);
    assert.deepEqual(next.position, previous.position, id);
    assert.equal(next.yaw, previous.yaw, id);
  }
  assert.notEqual(before.speakers.find(s => s.id === 'L').distance, after.speakers.find(s => s.id === 'L').distance);

  const arrivals = after.speakers.filter(s => s.model !== 'sub').map(s => s.distance / 343 * 1000 + s.delayMs);

  assert.ok(Math.max(...arrivals) - Math.min(...arrivals) < 1e-9);

});

test('manual first-row movement leaves the projector and all other rows in place', () => {
  for (const audio of ['5.1', '5.1.2', '7.2.4']) {
    const d = { ...DEFAULT_DESIGN, audio };
    const before = calculateDesign(d);
    const after = calculateDesign({ ...d, positions: { 'row-0': constrainObjectMove(d, 'row-0', [0, 0, 3.1]) } });
    assert.deepEqual(after.projector, before.projector);
    assert.equal(after.rearExtent, before.rearExtent);
    for (const speaker of before.sound.speakers) {
      const next = after.sound.speakers.find(s => s.id === speaker.id);
      const follows = ['SL', 'SR'].includes(speaker.id);
      if (follows) assert.notDeepEqual(next.position, speaker.position, speaker.id);
      else { assert.deepEqual(next.position, speaker.position, speaker.id); assert.equal(next.yaw, speaker.yaw, speaker.id); }
    }
    const mounted = { ...d, positions: { projector: [0, d.height - .42, 4.5] } };
    assert.deepEqual(calculateDesign({ ...mounted, positions: { ...mounted.positions, 'row-0': [0, 0, 3.9] } }).projector, calculateDesign(mounted).projector);
    const rearMoved = calculateDesign({ ...d, positions: { 'row-1': [0, d.riser, 5.5] } });
    assert.deepEqual(rearMoved.sound.speakers, before.sound.speakers);
    assert.deepEqual(rearMoved.projector, before.projector);
  }
});

test('custom wall colours survive save/load and old preset designs remain valid', () => {
  const custom = { ...DEFAULT_DESIGN, finish: 'custom', wallColor: '#8A506E' };
  const restored = parseSavedDesign(JSON.stringify({ version: 1, design: custom }));
  assert.equal(restored.finish, 'custom');
  assert.equal(restored.wallColor, '#8a506e');
  for (const finish of ['graphite', 'walnut', 'midnight']) assert.equal(parseSavedDesign(JSON.stringify({ version: 1, design: { ...DEFAULT_DESIGN, finish } })).finish, finish);
  for (const wallColor of [undefined, '#12', '#gggggg', 'red', '#123456;display:none', 123456]) assert.throws(() => parseSavedDesign(JSON.stringify({ version: 1, design: { ...custom, wallColor } })));
});

test('surround azimuths follow layout targets and rear speakers trace 145-degree rays', () => {

  for (const audio of ['5.1', '5.1.2', '7.2.4']) {

    const { speakers } = solveSpeakers({ ...DEFAULT_DESIGN, audio });

    const target = audio === '7.2.4' ? 100 : 110;

    for (const id of ['SL', 'SR']) assert.ok(Math.abs(Math.abs(speakers.find(s => s.id === id).azimuth) - target) < 0.001);

    for (const s of speakers.filter(s => ['SBL', 'SBR'].includes(s.id))) assert.ok(Math.abs(Math.abs(s.azimuth) - 145) < 0.001);

  }

});

test('extreme configurations stay finite and cabinets stay within room boundaries', () => {

  for (const width of [3, 4.8, 8]) for (const depth of [4, 7, 12]) for (const distance of [1.8, 3.5, 7]) for (const height of [2.2, 4]) for (const aisle of ['left', 'both', 'right']) {

    const d = { ...DEFAULT_DESIGN, width, depth, distance, height, aisle };

    for (const s of solveSpeakers(d).speakers) {

      const radius = Math.hypot(s.size[0], s.size[2]) / 2;

      assert.ok(Math.abs(s.position[0]) + radius <= width / 2 + 1e-9);

      assert.ok(Math.abs(s.position[2]) + radius <= depth / 2 + 1e-9);

      assert.ok(s.position[1] >= 0 && s.position[1] + s.size[1] <= height + 1e-9);

      assert.ok([s.yaw, s.distance, s.delayMs, s.azimuth, s.elevation].every(Number.isFinite));

      assert.ok(s.delayMs >= 0);

    }

  }

  assert.ok(solveSpeakers({ ...DEFAULT_DESIGN, depth: 4, distance: 7 }).warnings.length);

});



test('manual rows and equipment retain placement, serialize and flag invalid room bounds', () => {
  const d = { ...DEFAULT_DESIGN, positions: { 'row-0': [0.5, 0, 3], 'row-1': [3, 0.25, 7], L: [-3, 0, 1], projector: [0, 2.38, 6] } };
  assert.deepEqual(parseSavedDesign(JSON.stringify({ version: 1, design: d })).positions, { "row-0": [0, 0, 3], "row-1": [0, 0.25, 7], projector: [0, 2.38, 6] });
  const result = calculateDesign(d);
  assert.deepEqual(result.sound.listener, [0, 1.15, -0.5]);
  assert.ok(result.sound.speakers.find(s => s.id === 'L').position[0] > -2.4);
  assert.ok(result.warnings.some(w => w.includes('row 2 extends outside')));
  assert.ok(!result.warnings.some(w => w.includes('L is outside')));
  const smaller = calculateDesign({ ...d, depth: 5, diagonal: 65 });
  assert.ok(smaller.warnings.some(w => w.includes('projector is outside the room')));
  assert.ok(smaller.warnings.some(w => w.includes('throw range')));
});
test('manually overlapping rows fail fit checks and untouched speakers follow the moved primary row', () => {
  const before = calculateDesign(DEFAULT_DESIGN);
  const after = calculateDesign({ ...DEFAULT_DESIGN, positions: { 'row-0': [0.4, 0, 4.8] } });
  assert.ok(after.warnings.some(w => w.includes('overlap')));
  assert.notDeepEqual(before.sound.speakers.find(s => s.id === 'SL').position, after.sound.speakers.find(s => s.id === 'SL').position);
});
test('saved object overrides reject unknown keys, invalid vectors and non-finite values', () => {
  for (const positions of [{ random: [0, 0, 0] }, { L: [0, 0] }, { projector: [0, '2', 3] }, { 'row-4': [0, 0, 3] }, { L: [0, 0, 100] }, []]) {
    assert.throws(() => parseSavedDesign(JSON.stringify({ version: 1, design: { ...DEFAULT_DESIGN, positions } })));
  }
});


test('seat and projector drags lock sideways and vertical axes and respect their tracks', () => {
  const row = constrainObjectMove(DEFAULT_DESIGN, 'row-1', [9, 5, 5.5]);
  assert.deepEqual(row, [0, 0.25, 5.5]);
  const projector = constrainObjectMove(DEFAULT_DESIGN, 'projector', [4, 0, 99]);
  assert.equal(projector[0], 0); assert.equal(projector[1], 2.38);
  assert.ok(projector[2] <= DEFAULT_DESIGN.depth - 0.22);
  assert.equal(constrainObjectMove(DEFAULT_DESIGN, 'SUB1', [1,0,2]), null);
  assert.equal(constrainObjectMove(DEFAULT_DESIGN, 'L', [1,0,2]), null);
  assert.equal(constrainObjectMove(DEFAULT_DESIGN, 'row-2', [0,0,2]), null);
});

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} != ${expected}`);
const moved = (d, id, z) => ({ ...d, positions: { ...d.positions, [id]: constrainObjectMove(d, id, [9, 9, z]) } });

test('dragging either row through its neighbour stops at the recliner clearance', () => {
  const first = moved(DEFAULT_DESIGN, 'row-0', 100);
  near(first.positions['row-0'][2], 5.2 - MIN_ROW_SPACING);
  const second = moved(DEFAULT_DESIGN, 'row-1', -100);
  near(second.positions['row-1'][2], 3.5 + MIN_ROW_SPACING);
  const separated = moved(DEFAULT_DESIGN, 'row-1', 5.8);
  const advanced = moved(separated, 'row-0', 100);
  near(advanced.positions['row-0'][2], 5.8 - MIN_ROW_SPACING);
  assert.deepEqual(advanced.positions['row-1'], separated.positions['row-1']);
});

test('three-row middle seating stops against both neighbours without reordering rows', () => {
  const d = fitSeatingLayout({ ...DEFAULT_DESIGN, depth: 10, rows: 3, distance: 3 }).design;
  assert.ok(d);
  const first = d.positions['row-0'][2], last = d.positions['row-2'][2];
  near(constrainObjectMove(d, 'row-1', [0,0,-100])[2], first + MIN_ROW_SPACING);
  near(constrainObjectMove(d, 'row-1', [0,0,100])[2], last - MIN_ROW_SPACING);
});

test('a single row stops before the screen and rear wall using its full footprint', () => {
  const d = { ...DEFAULT_DESIGN, rows: 1 };
  const front = constrainObjectMove(d, 'row-0', [0,0,-100]);
  const rear = constrainObjectMove(d, 'row-0', [0,0,100]);
  assert.ok(front[2] - SEATING_CLEARANCE.depth / 2 >= SEATING_CLEARANCE.front + SEATING_CLEARANCE.screenFace - 1e-6);
  assert.ok(2 * Math.atan(screenSize(d.diagonal, d.aspect).width / (2 * (front[2] - SEATING_CLEARANCE.screenFace))) * 180 / Math.PI <= 60 + 1e-6);
  assert.ok(rear[2] + SEATING_CLEARANCE.depth / 2 + SEATING_CLEARANCE.rear <= d.depth + 1e-6);
  near(rear[2], rowMotionBounds(d,0).max);
});

test('cabinet footprint creates a hard stop and a large pointer jump cannot tunnel through it', () => {
  const d = { ...DEFAULT_DESIGN, rows: 1, seats: 4, aisleWidth: .4, equipmentSizes: { SUB1: [.8,.8,.8] } };
  const fit = fitSeatingLayout(d); assert.ok(fit.design, fit.reason);
  const bounds = rowMotionBounds(fit.design, 0);
  const stop = constrainObjectMove(fit.design, 'row-0', [0,0,-999]);
  near(stop[2], bounds.min);
  const sub = solveSpeakers(fit.design).speakers.find(s => s.id === 'SUB1');
  assert.ok(stop[2] - .7 - (sub.position[2] + d.depth/2 + Math.hypot(.8,.8)/2) >= .15 - 1e-6);
});

test('side surrounds cannot be dragged into the front or rear speaker cabinets', () => {
  for (const audio of ['5.1','5.1.2','7.2.4']) {
    let d = { ...DEFAULT_DESIGN, rows: 1, audio };
    for (const target of [-100,100]) {
      const next = moved(d, 'row-0', target); const speakers = solveSpeakers(next).speakers;
      for (const side of speakers.filter(s => ['SL','SR'].includes(s.id))) for (const fixed of speakers.filter(s => !['SL','SR'].includes(s.id))) {
        if (fixed.position[1] >= side.position[1] + side.size[1] || fixed.position[1] + fixed.size[1] <= side.position[1]) continue;
        const gap = Math.hypot(side.size[0],side.size[2])/2 + Math.hypot(fixed.size[0],fixed.size[2])/2 + .15;
        assert.ok(Math.abs(fixed.position[0] - side.position[0]) >= gap - 1e-6 || Math.abs(fixed.position[2] - side.position[2]) >= gap - 1e-6, `${side.id} touches ${fixed.id}`);
      }
    }
  }
});

test('automatic fitting repairs old swapped rows and rejects rooms that cannot fit', () => {
  const swapped = { ...DEFAULT_DESIGN, positions: { 'row-0': [0,0,6], 'row-1': [0,.25,2] } };
  assert.equal(constrainObjectMove(swapped,'row-0',[0,0,4]), null);
  const repaired = fitSeatingLayout(swapped); assert.ok(repaired.design, repaired.reason);
  assert.ok(repaired.design.positions['row-1'][2] - repaired.design.positions['row-0'][2] >= MIN_ROW_SPACING - 1e-6);
  for (const d of [{ ...DEFAULT_DESIGN, depth: 4, rows: 3 }, { ...DEFAULT_DESIGN, width: 3, seats: 5 }, { ...DEFAULT_DESIGN, height: 2.2, rows: 3, riser: .45 }, { ...DEFAULT_DESIGN, diagonal: 180, width: 3 }]) assert.equal(fitSeatingLayout(d).design, null);
});

test('resizing fits rows safely and clamps an existing projector without moving it on seat drags', () => {
  const d = { ...DEFAULT_DESIGN, depth: 6, positions: { 'row-0': [0,0,3.5], 'row-1': [0,.25,6], projector: [0,2.38,6.5] } };
  const fit = fitSeatingLayout(d); assert.ok(fit.design, fit.reason);
  assert.ok(fit.design.positions['row-1'][2] <= 5 + 1e-6);
  assert.ok(fit.design.positions.projector[2] <= d.depth - .22);
  const next = moved(fit.design, 'row-0', -100);
  assert.deepEqual(calculateDesign(next).projector, calculateDesign(fit.design).projector);
});

test('all presets and a room/row/equipment matrix either fit safely or explain rejection', () => {
  const candidates = PRESETS.map(p => ({ ...DEFAULT_DESIGN, ...p.values }));
  for (const width of [3.5,4.8,6.4]) for (const depth of [4,6,8,10]) for (const rows of [1,2,3]) for (const aisle of ['left','both','right']) for (const audio of ['5.1','7.2.4']) candidates.push({ ...DEFAULT_DESIGN, width, depth, rows, aisle, audio });
  let fits = 0, rejected = 0;
  for (const candidate of candidates) {
    const result = fitSeatingLayout(candidate);
    if (!result.design) { assert.ok(result.reason); rejected++; continue; }
    fits++; const d = result.design;
    for (let row = 0; row < d.rows; row++) {
      assert.ok(rowMotionBounds(d,row).valid, JSON.stringify(d));
      for (const target of [-100,100]) {
        const next = moved(d, `row-${row}`, target);
        assert.ok(rowMotionBounds(next,row).valid);
        for (let other = 0; other < d.rows; other++) if (row !== other) assert.deepEqual(seatingPosition(next,other),seatingPosition(d,other));
      }
    }
  }
  assert.ok(fits > 50 && rejected > 50);
});

test('non-finite inputs and nonexistent rows never change the layout', () => {
  for (const value of [NaN,Infinity,-Infinity]) assert.equal(constrainObjectMove(DEFAULT_DESIGN,'row-0',[0,0,value]),null);
  assert.equal(constrainObjectMove(DEFAULT_DESIGN,'row--1',[0,0,3]),null);
});
