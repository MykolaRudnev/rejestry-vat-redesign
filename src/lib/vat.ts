import type { VatRate } from "./types";

export const rateValue: Record<VatRate, number> = { "23": 0.23, "8": 0.08, "5": 0.05, "0": 0, zw: 0, np: 0 };

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function computeVat(net: number, rate: VatRate) {
  const vat = round2(net * rateValue[rate]);
  return { vat, gross: round2(net + vat) };
}
