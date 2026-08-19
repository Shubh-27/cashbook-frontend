import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { type DateRange, presets, formatDateRangeLabel, getCurrentFinancialYearStart } from '../utils/date';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface DateRangePickerProps {
  range: DateRange | null;
  onChange: (range: DateRange | null) => void;
}

export function DateRangePicker({ range, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const handlePreset = (presetFn: () => DateRange) => {
    onChange(presetFn());
    setOpen(false);
  };

  const handleCustomChange = (field: 'from' | 'to', value: string) => {
    if (!value) return;
    const [year, month, day] = value.split('-').map(Number);
    const newDate = new Date(year, month - 1, day);
    const newRange = range ? { ...range } : { from: new Date(), to: new Date() };
    newRange[field] = newDate;

    // Set hours to start/end of day
    if (field === 'from') {
      newRange.from.setHours(0, 0, 0, 0);
    } else {
      newRange.to.setHours(23, 59, 59, 999);
    }

    onChange(newRange);
  };

  const getFYLabel = (startYear: number) => {
    const y1 = String(startYear).slice(2);
    const y2 = String(startYear + 1).slice(2);
    return `FY ${y1}-${y2}`;
  };

  const currentFYStart = getCurrentFinancialYearStart();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          aria-label="Select date range"
          className={`flex items-center justify-start text-left font-normal h-9 bg-white border border-slate-200 rounded-xl px-3 cursor-pointer hover:bg-slate-50 transition-colors text-xs sm:text-sm shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
            !range ? "text-slate-500" : "border-teal-500 text-teal-700 bg-teal-50/50"
          }`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen(true);
            }
          }}
        >
          <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[170px] sm:max-w-[240px] font-medium">{formatDateRangeLabel(range)}</span>
          {range && (
            <button
              type="button"
              aria-label="Clear date range"
              className="ml-1.5 p-0.5 text-slate-400 hover:text-rose-500 transition-colors shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(null);
                setOpen(false);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] sm:w-[330px] max-w-[calc(100vw-2rem)] p-4 flex flex-col gap-4 bg-white shadow-2xl border border-slate-200/80 rounded-3xl" align="start">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">Quick Presets</span>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" className="justify-start text-xs h-9 px-3 rounded-xl hover:bg-teal-50 hover:text-teal-700 font-medium active:scale-95 transition-all" onClick={() => handlePreset(presets.currentFY)}>
              Current {getFYLabel(currentFYStart)}
            </Button>
            <Button variant="ghost" className="justify-start text-xs h-9 px-3 rounded-xl hover:bg-teal-50 hover:text-teal-700 font-medium active:scale-95 transition-all" onClick={() => handlePreset(presets.thisMonth)}>
              This Month
            </Button>
            <Button variant="ghost" className="justify-start text-xs h-9 px-3 rounded-xl hover:bg-teal-50 hover:text-teal-700 font-medium active:scale-95 transition-all" onClick={() => handlePreset(presets.previousFY)}>
              {getFYLabel(currentFYStart - 1)}
            </Button>
            <Button variant="ghost" className="justify-start text-xs h-9 px-3 rounded-xl hover:bg-teal-50 hover:text-teal-700 font-medium active:scale-95 transition-all" onClick={() => handlePreset(presets.lastMonth)}>
              Last Month
            </Button>
            <Button variant="ghost" className="justify-start text-xs h-9 px-3 rounded-xl hover:bg-teal-50 hover:text-teal-700 font-medium active:scale-95 transition-all" onClick={() => handlePreset(presets.twoYearsAgoFY)}>
              {getFYLabel(currentFYStart - 2)}
            </Button>
            <Button variant="ghost" className="justify-start text-xs h-9 px-3 rounded-xl hover:bg-teal-50 hover:text-teal-700 font-medium active:scale-95 transition-all" onClick={() => handlePreset(presets.lastQuarter)}>
              Last Quarter
            </Button>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3 flex flex-col gap-2.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1">Custom Range</span>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label htmlFor="date-range-from" className="text-[10px] text-slate-500 uppercase font-semibold px-1">From</Label>
              <Input
                id="date-range-from"
                type="date"
                className="h-10 text-xs px-2.5 rounded-xl cursor-pointer bg-slate-50/70 border-slate-200"
                value={range ? format(range.from, 'yyyy-MM-dd') : ''}
                onChange={(e) => handleCustomChange('from', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="date-range-to" className="text-[10px] text-slate-500 uppercase font-semibold px-1">To</Label>
              <Input
                id="date-range-to"
                type="date"
                className="h-10 text-xs px-2.5 rounded-xl cursor-pointer bg-slate-50/70 border-slate-200"
                value={range ? format(range.to, 'yyyy-MM-dd') : ''}
                onChange={(e) => handleCustomChange('to', e.target.value)}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
