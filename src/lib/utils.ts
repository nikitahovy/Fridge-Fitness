export function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function daysAgo(days: number): string {
  return daysFromNow(-days);
}

export function daysBetween(dateStr: string, reference?: string): number {
  const a = new Date(dateStr);
  const b = reference ? new Date(reference) : new Date();
  const diffMs = a.getTime() - b.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatDollars(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function today(): string {
  return new Date().toISOString().split("T")[0];
}
