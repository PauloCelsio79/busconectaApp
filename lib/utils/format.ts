export function parsePreco(value: string | number): number {
  if (typeof value === 'number') return value;
  const cleaned = value.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function formatPreco(value: number): string {
  return value.toLocaleString('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPrecoKz(value: number): string {
  return `${formatPreco(value)} Kz`;
}
