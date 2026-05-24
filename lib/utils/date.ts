/** Converte DD/MM para YYYY-MM-DD (ano corrente ou seguinte se já passou). */
export function ddmmToIso(value: string): string | null {
  const parts = value.split('/').map((p) => Number(p.trim()));
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

  const [day, month] = parts;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let year = today.getFullYear();
  let date = new Date(year, month - 1, day);
  if (date < today) {
    year += 1;
    date = new Date(year, month - 1, day);
  }

  if (date.getDate() !== day || date.getMonth() !== month - 1) return null;

  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function isoToDdmm(iso?: string | null): string {
  if (!iso) return '';
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return iso;
  return `${match[3]}/${match[2]}`;
}

export function formatHora(hora?: string | null): string {
  if (!hora) return '—';
  const parts = hora.split(':');
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return hora;
}
