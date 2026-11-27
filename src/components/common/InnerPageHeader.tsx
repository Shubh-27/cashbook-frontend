import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
  onClick?: () => void;
}

interface InnerPageHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

/**
 * Shared header with breadcrumb navigation for secondary/inner pages.
 */
export function InnerPageHeader({ breadcrumbs, title, subtitle, actions }: InnerPageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="hidden md:flex flex-col gap-1">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate-500">
        {breadcrumbs.map((crumb, index) => (
          <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />}
            {crumb.onClick || crumb.to ? (
              <button
                type="button"
                onClick={() => {
                  if (crumb.onClick) {
                    crumb.onClick();
                  } else if (crumb.to) {
                    navigate(crumb.to);
                  }
                }}
                className="cursor-pointer rounded text-slate-500 transition-colors hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                {crumb.label}
              </button>
            ) : (
              <span className="text-slate-500">{crumb.label}</span>
            )}
          </span>
        ))}
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 md:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
