import test from 'node:test';

import assert from 'node:assert/strict';

import { DEFAULT_DESIGN, calculateDesign, parseSavedDesign, screenSize, solveSpeakers, constrainObjectMove } from '../src/components/theater-builder/design.ts';



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

test('moving primary seating updates surround and height positions, aiming and delays', () => {

  const before = solveSpeakers(DEFAULT_DESIGN);

  const after = solveSpeakers({ ...DEFAULT_DESIGN, distance: 4, aisle: 'left' });

  for (const id of ['SL', 'SR', 'TFL', 'TFR', 'TRL', 'TRR']) {

    assert.notDeepEqual(before.speakers.find(s => s.id === id).position, after.speakers.find(s => s.id === id).position);

  }

  assert.notEqual(before.speakers.find(s => s.id === 'L').yaw, after.speakers.find(s => s.id === 'L').yaw);

  const arrivals = after.speakers.filter(s => s.model !== 'sub').map(s => s.distance / 343 * 1000 + s.delayMs);

  assert.ok(Math.max(...arrivals) - Math.min(...arrivals) < 1e-9);

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
