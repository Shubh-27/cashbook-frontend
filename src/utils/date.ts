import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  subQuarters,
  format,
} from 'date-fns';

export interface DateRange {
  from: Date;
  to: Date;
}

export const getFinancialYear = (yearStart: number): DateRange => {
  return {
    from: new Date(yearStart, 3, 1), // April 1st
    to: new Date(yearStart + 1, 2, 31, 23, 59, 59, 999), // March 31st next year
  };
};

export const getCurrentFinancialYearStart = (date: Date = new Date()): number => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed, 3 is April
  return month >= 3 ? year : year - 1;
};

export const presets = {
  currentFY: () => {
    const startYear = getCurrentFinancialYearStart();
    return getFinancialYear(startYear);
  },
  previousFY: () => {
    const startYear = getCurrentFinancialYearStart();
    return getFinancialYear(startYear - 1);
  },
  twoYearsAgoFY: () => {
    const startYear = getCurrentFinancialYearStart();
    return getFinancialYear(startYear - 2);
  },
  thisMonth: () => ({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  }),
  lastMonth: () => {
    const lastMonth = subMonths(new Date(), 1);
    return {
      from: startOfMonth(lastMonth),
      to: endOfMonth(lastMonth),
    };
  },
  lastQuarter: () => {
    const lastQuarter = subQuarters(new Date(), 1);
    return {
      from: startOfQuarter(lastQuarter),
      to: endOfQuarter(lastQuarter),
    };
  },
};

export const formatDateForPayload = (date: Date) => {
  return date.toISOString();
};

export const formatDateRangeLabel = (range: DateRange | null) => {
  if (!range) return 'Select range';
  return `${format(range.from, 'dd MMM yyyy')} - ${format(range.to, 'dd MMM yyyy')}`;
};
