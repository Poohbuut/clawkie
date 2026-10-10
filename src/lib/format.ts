export const peso = (n: number) => `\u20b1${n.toFixed(2)}`;

export function formatTime(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export const pad = (n: number) => String(n).padStart(2, '0');

export const toISODate = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
