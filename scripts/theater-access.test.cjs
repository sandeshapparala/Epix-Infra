require("./theater-test-loader.cjs");
const test = require("node:test"),
  assert = require("node:assert/strict");
const {
  requireActive,
  requireOwner,
  requireAdmin,
  requireDiscount,
  requireServiceRates,
  requireSelfSafe,
} = require("../src/lib/theater/access.ts");
const member = (role = "employee") => ({
  uid: "employee-a",
  active: true,
  role,
  maxDiscountPercent: 7.5,
});
test("only active admin and employee profiles receive workspace access", () => {
  for (const actor of [
    null,
    { ...member(), active: false },
    { ...member(), role: "super-admin" },
    { ...member(), role: "marketing-admin" },
    { ...member(), maxDiscountPercent: NaN },
    { ...member(), maxDiscountPercent: undefined },
  ])
    assert.throws(() => requireActive(actor));
  requireActive(member());
  requireActive(member("admin"));
});
test("employee discount accepts the inclusive zero-to-cap interval and rejects forged values", () => {
  for (const value of [0, 0.1, 5, 7.5])
    assert.doesNotThrow(() => requireDiscount(member(), value));
  for (const value of [-1, 7.5001, 100, NaN, Infinity])
    assert.throws(() => requireDiscount(member(), value));
  requireDiscount(member("admin"), 100);
  assert.throws(() => requireDiscount(member("admin"), 100.1));
});
test("ownership is checked independently from model selection and roles", () => {
  requireOwner(member(), "employee-a");
  assert.throws(
    () => requireOwner(member(), "employee-b"),
    (e) => e.status === 404,
  );
  requireOwner(member("admin"), "employee-b");
  assert.throws(() => requireAdmin(member()));
});
test("approved rates prevent a unit-price, GST or ad-hoc-line discount bypass", () => {
  const rate = {
    id: "rate-1",
    active: true,
    amountPaise: 10000,
    gstRate: 18,
    category: "installation",
  };
  const line = {
    rateId: rate.id,
    amountPaise: 10000,
    gstRate: 18,
    category: "installation",
  };
  requireServiceRates(member(), [line], [rate]);
  for (const next of [
    { ...line, amountPaise: 1 },
    { ...line, gstRate: 0 },
    { ...line, category: "other" },
    { ...line, rateId: undefined },
  ])
    assert.throws(() => requireServiceRates(member(), [next], [rate]));
  assert.throws(() =>
    requireServiceRates(member(), [line], [{ ...rate, active: false }]),
  );
  requireServiceRates(member("admin"), [{ ...line, amountPaise: 1 }], []);
});
test("an administrator cannot disable or demote their own account", () => {
  assert.throws(() =>
    requireSelfSafe(member("admin"), "employee-a", "employee", true),
  );
  assert.throws(() =>
    requireSelfSafe(member("admin"), "employee-a", "admin", false),
  );
  requireSelfSafe(member("admin"), "another", "employee", false);
});
