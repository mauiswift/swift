export type PaymentDateRange =
  | 'all'
  | 'last7'
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom';

function toLocalDate(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

export function getPaymentDateRangeBounds(
  range: PaymentDateRange,
  customStart: string,
  customEnd: string,
  now = new Date(),
): { start: Date; end: Date } | null {
  if (range === 'all') return null;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);
  if (range === 'custom') {
    const start = toLocalDate(customStart);
    const inclusiveEnd = toLocalDate(customEnd);
    if (!start || !inclusiveEnd || start > inclusiveEnd) return null;
    const end = new Date(inclusiveEnd);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }
  if (range === 'today') return { start: startOfToday, end: endOfToday };
  if (range === 'yesterday') {
    const start = new Date(startOfToday);
    start.setDate(start.getDate() - 1);
    return { start, end: startOfToday };
  }
  if (range === 'last7') {
    const start = new Date(startOfToday);
    start.setDate(start.getDate() - 6);
    return { start, end: endOfToday };
  }
  if (range === 'thisMonth') {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfToday };
  }

  const day = startOfToday.getDay();
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - (day === 0 ? 6 : day - 1));
  if (range === 'lastWeek') {
    const start = new Date(startOfWeek);
    start.setDate(start.getDate() - 7);
    return { start, end: startOfWeek };
  }
  if (range === 'lastMonth') {
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 1),
    };
  }
  return { start: startOfWeek, end: endOfToday };
}
