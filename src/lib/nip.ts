const WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7];

export function normalizeNip(input: string) {
  return input.replace(/[\s-]/g, "").replace(/^PL/i, "");
}

export function nipChecksum(first9: string): number {
  const sum = WEIGHTS.reduce((acc, w, i) => acc + w * Number(first9[i]), 0);
  return sum % 11;
}

export function isValidNip(input: string) {
  const nip = normalizeNip(input);
  if (!/^\d{10}$/.test(nip)) return false;
  const c = nipChecksum(nip.slice(0, 9));
  return c !== 10 && c === Number(nip[9]);
}
