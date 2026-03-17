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
    const newDate = new Date(value);
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
          className={`flex items-center justify-start text-left font-normal w-[280px] h-9 bg-white border border-slate-200 rounded-md px-3 cursor-pointer hover:bg-slate-50 transition-colors text-sm ${!range && "text-slate-500"}`}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-slate-400 shrink-0" />
          <span className="truncate flex-1">{formatDateRangeLabel(range)}</span>
          {range && (
            <X
              className="ml-2 h-4 w-4 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(null);
                setOpen(false);
              }}
            />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-4 flex flex-col gap-4 bg-white shadow-xl border border-slate-200 rounded-xl" align="start">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" className="justify-start text-xs h-8 px-2" onClick={() => handlePreset(presets.currentFY)}>
            Current {getFYLabel(currentFYStart)}
          </Button>
          <Button variant="ghost" className="justify-start text-xs h-8 px-2" onClick={() => handlePreset(presets.thisMonth)}>
            This Month
          </Button>
          <Button variant="ghost" className="justify-start text-xs h-8 px-2" onClick={() => handlePreset(presets.previousFY)}>
            {getFYLabel(currentFYStart - 1)}
          </Button>
          <Button variant="ghost" className="justify-start text-xs h-8 px-2" onClick={() => handlePreset(presets.lastMonth)}>
            Last Month
          </Button>
          <Button variant="ghost" className="justify-start text-xs h-8 px-2" onClick={() => handlePreset(presets.twoYearsAgoFY)}>
            {getFYLabel(currentFYStart - 2)}
          </Button>
          <Button variant="ghost" className="justify-start text-xs h-8 px-2" onClick={() => handlePreset(presets.lastQuarter)}>
            Last Quarter
          </Button>
        </div>

        <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Custom Range</span>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-400 uppercase font-bold">From</Label>
              <Input
                type="date"
                className="h-8 text-xs px-2 cursor-pointer"
                value={range ? format(range.from, 'yyyy-MM-dd') : ''}
                onChange={(e) => handleCustomChange('from', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-slate-400 uppercase font-bold">To</Label>
              <Input
                type="date"
                className="h-8 text-xs px-2 cursor-pointer"
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
