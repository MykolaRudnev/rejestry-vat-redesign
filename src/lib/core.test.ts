// Money, NIP and date parsing — the logic a wrong digit here would silently break. Run: pnpm test
import assert from "node:assert/strict";
import test from "node:test";
import { isValidNip, normalizeNip } from "./nip.ts";
import { parseAmount, plToIso, splitMoney } from "./format.ts";
import { computeVat } from "./vat.ts";

test("NIP checksum", () => {
  assert.equal(isValidNip("5842799130"), true);
  assert.equal(isValidNip("584-279-91-30"), true);
  assert.equal(isValidNip("PL5842799130"), true);
  assert.equal(isValidNip("5842799131"), false);
  assert.equal(isValidNip("123"), false);
  assert.equal(normalizeNip("584-279 91-30"), "5842799130");
});

test("pl-PL amounts", () => {
  assert.equal(parseAmount("1 234,5"), 1234.5);
  assert.equal(parseAmount("1 234,56 zł"), 1234.56);
  assert.equal(parseAmount("1234.56"), 1234.56);
  assert.equal(parseAmount("-282,00"), -282);
  assert.ok(Number.isNaN(parseAmount("12,345")));
  assert.ok(Number.isNaN(parseAmount("abc")));
});

test("VAT and money split", () => {
  assert.deepEqual(computeVat(36350, "23"), { vat: 8360.5, gross: 44710.5 });
  assert.deepEqual(computeVat(-1018, "23"), { vat: -234.14, gross: -1252.14 });
  assert.deepEqual(computeVat(100, "np"), { vat: 0, gross: 100 });
  assert.deepEqual(splitMoney(-2349.3), { sign: "−", int: "2 349", dec: "30" });
});

test("dd.mm.rrrr dates", () => {
  assert.equal(plToIso("24.10.2026"), "2026-10-24");
  assert.equal(plToIso("4/1/26"), "2026-01-04");
  assert.equal(plToIso("24102026"), "2026-10-24");
  assert.equal(plToIso("31.02.2026"), null);
  assert.equal(plToIso("2026-10-24"), null);
});

test("demo companies have valid NIPs", async () => {
  const { companies } = await import("../data/companies.ts");
  for (const c of companies) assert.ok(isValidNip(c.nip), `${c.shortName}: ${c.nip}`);
});
