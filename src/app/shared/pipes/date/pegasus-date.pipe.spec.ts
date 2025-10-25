import { PegasusDatePipe, PegasusDateFormat } from './pegasus-date.pipe';

// NOTE: These tests ensure the centralized date formatting remains consistent.
// If you change formatting patterns in PegasusDatePipe, update expectations here accordingly.

describe('PegasusDatePipe', () => {
  let pipe: PegasusDatePipe;

  beforeEach(() => {
    pipe = new PegasusDatePipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('Default format', () => {
    it('formats a Date object', () => {
      const date = new Date(2025, 0, 15); // 15 Jan 2025 local time
      expect(pipe.transform(date, PegasusDateFormat.Default)).toBe('15 Jan 2025');
    });

    it('formats a number (ms since epoch)', () => {
      const ms = new Date(2025, 0, 15).getTime();
      expect(pipe.transform(ms, PegasusDateFormat.Default)).toBe('15 Jan 2025');
    });

    it('formats an ISO date string', () => {
      expect(pipe.transform('2025-01-15T10:00:00')).toBe('15 Jan 2025');
    });
  });

  describe('DateTimeShort format', () => {
    it('includes time component HH:mm', () => {
      const date = new Date(2025, 0, 15, 14, 30); // 15 Jan 2025 14:30
      expect(pipe.transform(date, PegasusDateFormat.DateTimeShort)).toBe('15 Jan 2025 14:30');
    });
  });

  describe('Time format', () => {
    it('returns only the time HH:mm', () => {
      const date = new Date(2025, 0, 15, 7, 5); // 07:05
      expect(pipe.transform(date, PegasusDateFormat.Time)).toBe('07:05');
    });
  });

  describe('DayOfWeek format', () => {
    it('returns full weekday name (EEEE)', () => {
      // 15 Jan 2025 is a Wednesday
      const date = new Date(2025, 0, 15);
      expect(pipe.transform(date, PegasusDateFormat.DayOfWeek)).toBe('Wednesday');
    });
  });

  describe('Edge cases', () => {
    it('returns empty string for null', () => {
      expect(pipe.transform(null)).toBe('');
    });
    it('returns empty string for undefined', () => {
      expect(pipe.transform(undefined)).toBe('');
    });
  });

  describe('Default param behavior', () => {
    it('uses Default when no format specified', () => {
      const date = new Date(2025, 0, 15);
      expect(pipe.transform(date)).toBe('15 Jan 2025');
    });
  });
});
