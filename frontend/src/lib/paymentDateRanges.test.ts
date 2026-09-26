import { describe, expect, it } from 'vitest';
import { getPaymentDateRangeBounds } from './paymentDateRanges';

describe('payment date range bounds', () => {
  const now = new Date(2026, 8, 26, 15, 30);

  it('ends the previous week at the start of this week', () => {
    const bounds = getPaymentDateRangeBounds('lastWeek', '', '', now);
    expect(bounds?.start).toEqual(new Date(2026, 8, 14));
    expect(bounds?.end).toEqual(new Date(2026, 8, 21));
  });

  it('ends the previous month at the start of this month', () => {
    const bounds = getPaymentDateRangeBounds('lastMonth', '', '', now);
    expect(bounds?.start).toEqual(new Date(2026, 7, 1));
    expect(bounds?.end).toEqual(new Date(2026, 8, 1));
  });

  it('includes the selected end date in a custom range', () => {
    const bounds = getPaymentDateRangeBounds('custom', '2026-09-20', '2026-09-22', now);
    expect(bounds?.start).toEqual(new Date(2026, 8, 20));
    expect(bounds?.end).toEqual(new Date(2026, 8, 23));
  });

  it('rejects incomplete, impossible, and reversed custom dates', () => {
    expect(getPaymentDateRangeBounds('custom', '', '', now)).toBeNull();
    expect(getPaymentDateRangeBounds('custom', '2026-02-30', '2026-03-01', now)).toBeNull();
    expect(getPaymentDateRangeBounds('custom', '2026-09-22', '2026-09-20', now)).toBeNull();
  });
});
