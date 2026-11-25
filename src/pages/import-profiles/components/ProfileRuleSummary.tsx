import { CheckCircle2, Circle, Info, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ChecklistItem {
  label: string;
  done: boolean;
}

interface ProfileRuleSummaryProps {
  headerRowNumber?: number;
  lastTransactionRowNumber?: number;
  dateAppearance?: string;
  footerRule?: string;
  mappedFields: string[];
  problems: string[];
  checklist?: ChecklistItem[];
  showErrors?: boolean;
  onSave?: () => void;
  isSaving?: boolean;
  saveDisabled?: boolean;
  saveDisabledReason?: string;
}

export function ProfileRuleSummary({
  problems,
  checklist,
  showErrors = false,
  onSave,
  isSaving = false,
  saveDisabled = false,
  saveDisabledReason,
}: ProfileRuleSummaryProps) {
  const isReady = problems.length === 0;

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      aria-labelledby="profile-rule-summary-heading"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="profile-rule-summary-heading" className="text-sm font-semibold text-slate-900">Profile rules</h2>
        <span
          className="inline-flex items-center gap-1 text-xs text-slate-500"
          title="The end-of-transactions rule is created automatically from your selected last row"
        >
          <Info className="h-3.5 w-3.5" />
          Auto footer rule
        </span>
      </div>

      {checklist && checklist.length > 0 && (
        <ul className="mt-3 space-y-2" aria-label="Profile checklist">
          {checklist.map(item => (
            <li key={item.label} className="flex items-center gap-2 text-xs">
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              )}
              <span className={item.done ? 'font-medium text-slate-900' : 'text-slate-600'}>{item.label}</span>
            </li>
          ))}
        </ul>
      )}

      {showErrors && problems.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-rose-700" role="alert">
          {problems.map(problem => <li key={problem}>{problem}</li>)}
        </ul>
      )}

      {onSave && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          {isReady && saveDisabled && saveDisabledReason && (
            <p className="mb-2 text-xs text-amber-800">{saveDisabledReason}</p>
          )}
          <span title={saveDisabled ? (problems.length > 0 ? problems.join(' • ') : saveDisabledReason) : undefined}>
            <Button
              type="button"
              onClick={onSave}
              disabled={isSaving || saveDisabled}
              className="w-full bg-teal-700 text-white hover:bg-teal-800 focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving…' : 'Save profile'}
            </Button>
          </span>
        </div>
      )}
    </section>
  );
}
