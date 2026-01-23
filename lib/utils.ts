export function getUkrainianNumEnding(count: number): string {
  const n = Math.floor(Math.abs(count));
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod10 === 1 && mod100 !== 11) return '';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'и';
  return 'ів';
}
