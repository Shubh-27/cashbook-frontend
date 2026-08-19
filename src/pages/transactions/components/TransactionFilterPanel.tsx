import { useState, useEffect, useCallback } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRangePicker } from '@/components/DateRangePicker';
import { MultiSelectFilterPopover } from '@/components/MultiSelectFilterPopover';
import type { Account, Description } from '@/types';
import type { DateRange } from '@/utils/date';

export interface TransactionFilterPanelProps {
  accounts: Account[];
  descriptions: Description[];
  dateRange: DateRange | null;
  isAllTime: boolean;
  selectedAccountSids: string[];
  selectedDescriptionSids: string[];
  activeFilterCount: number;
  onApplyFilters: (filters: {
    dateRange: DateRange | null;
    accountSids: string[];
    descriptionSids: string[];
  }) => void;
  onClearAll: () => void;
  // Trigger button styling options
  buttonClassName?: string;
  isMobile?: boolean;
}

export function TransactionFilterPanel({
  accounts,
  descriptions,
  dateRange,
  selectedAccountSids,
  selectedDescriptionSids,
  activeFilterCount,
  onApplyFilters,
  onClearAll,
  buttonClassName,
  isMobile = false,
}: TransactionFilterPanelProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Staged state for pending filter changes
  const [tempDateRange, setTempDateRange] = useState<DateRange | null>(dateRange);
  const [tempSelectedAccounts, setTempSelectedAccounts] = useState<string[]>(selectedAccountSids);
  const [tempSelectedDescriptions, setTempSelectedDescriptions] = useState<string[]>(selectedDescriptionSids);

  // Sync staged state whenever the panel is opened or props change
  const syncStateFromProps = useCallback(() => {
    setTempDateRange(dateRange);
    setTempSelectedAccounts(selectedAccountSids);
    setTempSelectedDescriptions(selectedDescriptionSids);
  }, [dateRange, selectedAccountSids, selectedDescriptionSids]);

  useEffect(() => {
    if (popoverOpen || sheetOpen) {
      syncStateFromProps();
    }
  }, [popoverOpen, sheetOpen, syncStateFromProps]);

  const handleClearAll = () => {
    setTempDateRange(null);
    setTempSelectedAccounts([]);
    setTempSelectedDescriptions([]);
    onClearAll();
    setPopoverOpen(false);
    setSheetOpen(false);
  };

  const handleApply = () => {
    onApplyFilters({
      dateRange: tempDateRange,
      accountSids: tempSelectedAccounts,
      descriptionSids: tempSelectedDescriptions,
    });
    setPopoverOpen(false);
    setSheetOpen(false);
  };

  const accountOptions = accounts.map(acc => ({
    value: acc.account_sid,
    label: acc.account_name,
    subLabel: acc.account_number ? `${acc.account_number}` : undefined,
  }));

  const descriptionOptions = descriptions.map(desc => ({
    value: desc.description_sid,
    label: desc.description_name,
  }));

  // Mobile Bottom Sheet Render
  if (isMobile) {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            syncStateFromProps();
            setSheetOpen(true);
          }}
          className={`relative shrink-0 h-10 px-3 rounded-xl border-slate-200 text-slate-700 hover:text-teal-700 hover:bg-teal-50 flex items-center gap-1.5 ${buttonClassName || ''}`}
          aria-label="Filter transactions"
        >
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 bg-teal-600 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center leading-none">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Mobile Sliding Bottom Sheet Modal */}
        {sheetOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={() => setSheetOpen(false)}
            />

            {/* Sheet Container */}
            <div className="relative z-10 bg-white rounded-t-[28px] border-t border-slate-200 shadow-2xl p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-250 flex flex-col gap-4.5">
              {/* Drag Handle */}
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto -mt-1 mb-0.5" />

              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-slate-800">Filter Transactions</h3>
                  {activeFilterCount > 0 && (
                    <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                      {activeFilterCount} active
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  aria-label="Close filters"
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Controls Stacked */}
              <div className="space-y-4 py-1">
                {/* 1. Date Range */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Date Range</Label>
                  <DateRangePicker
                    range={tempDateRange}
                    onChange={setTempDateRange}
                  />
                </div>

                {/* 2. Accounts */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Accounts</Label>
                  <MultiSelectFilterPopover
                    options={accountOptions}
                    selectedValues={tempSelectedAccounts}
                    onChange={setTempSelectedAccounts}
                    allLabel="All Accounts"
                    searchPlaceholder="Search accounts..."
                    emptyText="No accounts found."
                    formatTriggerLabel={(count) => `${count} Account${count > 1 ? 's' : ''} Selected`}
                    triggerClassName="w-full justify-between h-10 rounded-xl"
                    contentClassName="w-[280px]"
                  />
                </div>

                {/* 3. Descriptions */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Descriptions / Tags</Label>
                  <MultiSelectFilterPopover
                    options={descriptionOptions}
                    selectedValues={tempSelectedDescriptions}
                    onChange={setTempSelectedDescriptions}
                    allLabel="All Descriptions"
                    searchPlaceholder="Search descriptions..."
                    emptyText="No descriptions found."
                    formatTriggerLabel={(count) => `${count} Tag${count > 1 ? 's' : ''} Selected`}
                    triggerClassName="w-full justify-between h-10 rounded-xl"
                    contentClassName="w-[280px]"
                  />
                </div>
              </div>

              {/* Sticky Footer Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <Button
                  onClick={handleApply}
                  className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-sm text-sm"
                >
                  Apply Filters
                </Button>
                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs font-semibold text-slate-500 hover:text-rose-600 py-1 transition-colors"
                  >
                    Clear all filters
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetOpen(false)}
                    className="text-xs font-medium text-slate-400 hover:text-slate-600 py-1 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop Popover Render
  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`relative shrink-0 h-9 rounded-xl border-slate-200 text-slate-600 hover:text-teal-600 hover:bg-teal-50 flex items-center gap-1.5 ${buttonClassName || ''}`}
          aria-label="Filter transactions"
        >
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 bg-teal-600 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center leading-none">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[320px] p-4 rounded-2xl border border-slate-200/80 bg-white shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-800">Filter Transactions</h3>
          </div>
          {activeFilterCount > 0 && (
            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
              {activeFilterCount} active
            </span>
          )}
        </div>

        {/* Stacked Controls */}
        <div className="space-y-3.5">
          {/* 1. Date Range */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Date Range</Label>
            <DateRangePicker
              range={tempDateRange}
              onChange={setTempDateRange}
            />
          </div>

          {/* 2. Accounts */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Accounts</Label>
            <MultiSelectFilterPopover
              options={accountOptions}
              selectedValues={tempSelectedAccounts}
              onChange={setTempSelectedAccounts}
              allLabel="All Accounts"
              searchPlaceholder="Search accounts..."
              emptyText="No accounts found."
              formatTriggerLabel={(count) => `${count} Account${count > 1 ? 's' : ''} Selected`}
              triggerClassName="w-full justify-between h-9 rounded-xl"
              contentClassName="w-[280px]"
            />
          </div>

          {/* 3. Descriptions */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Descriptions / Tags</Label>
            <MultiSelectFilterPopover
              options={descriptionOptions}
              selectedValues={tempSelectedDescriptions}
              onChange={setTempSelectedDescriptions}
              allLabel="All Descriptions"
              searchPlaceholder="Search descriptions..."
              emptyText="No descriptions found."
              formatTriggerLabel={(count) => `${count} Tag${count > 1 ? 's' : ''} Selected`}
              triggerClassName="w-full justify-between h-9 rounded-xl"
              contentClassName="w-[280px]"
            />
          </div>
        </div>

        {/* Popover Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
          >
            Clear all
          </button>
          <Button
            onClick={handleApply}
            className="h-8 px-4 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs"
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
