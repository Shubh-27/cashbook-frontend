interface ImportValidationSummaryProps {
  validRows: number;
  excludedRows: number;
  invalidRows: number;
  duplicateRows?: number;
  onFilterInvalid?: () => void;
  filterInvalidActive?: boolean;
}

export function ImportValidationSummary({
  validRows,
  excludedRows,
  invalidRows,
  duplicateRows = 0,
  onFilterInvalid,
  filterInvalidActive = false,
}: ImportValidationSummaryProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-labelledby="import-validation-summary-heading">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="import-validation-summary-heading" className="text-sm font-semibold text-slate-900">Validation summary</h2>
        <p className="text-xs text-slate-500">Based on first and last 100 rows</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Ready</p>
          <p className={`mt-1 text-lg font-semibold ${validRows > 0 ? 'text-emerald-700' : 'text-slate-600'}`}>{validRows}</p>
        </div>
        <div
          className="rounded-xl bg-slate-50 p-3"
          title="Blank, non-transaction, or header/footer rows outside the selected range"
        >
          <p className="text-xs text-slate-500">Excluded</p>
          <p className="mt-1 text-lg font-semibold text-slate-600">{excludedRows}</p>
        </div>
        <button
          type="button"
          onClick={onFilterInvalid}
          disabled={invalidRows === 0 || !onFilterInvalid}
          title="Rows with unparseable dates or missing amounts"
          aria-pressed={filterInvalidActive}
          className={`rounded-xl p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
            filterInvalidActive
              ? 'bg-rose-50 ring-1 ring-rose-300'
              : invalidRows > 0 && onFilterInvalid
                ? 'bg-slate-50 hover:bg-rose-50/70 cursor-pointer'
                : 'bg-slate-50 cursor-default'
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs text-slate-500">Needs attention</p>
            {invalidRows > 0 && onFilterInvalid && (
              <span className="text-[10px] font-medium text-rose-700">{filterInvalidActive ? 'Showing' : 'Jump'}</span>
            )}
          </div>
          <p className={`mt-1 text-lg font-semibold ${invalidRows > 0 ? 'text-rose-700' : 'text-slate-600'}`}>{invalidRows}</p>
        </button>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Duplicates</p>
          <p className={`mt-1 text-lg font-semibold ${duplicateRows > 0 ? 'text-amber-700' : 'text-slate-600'}`}>{duplicateRows}</p>
        </div>
      </div>
    </section>
  );
}
