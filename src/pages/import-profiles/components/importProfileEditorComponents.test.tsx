import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ColumnMappingPanel } from './ColumnMappingPanel';
import { ImportValidationSummary } from './ImportValidationSummary';
import { ProfileRuleSummary } from './ProfileRuleSummary';
import { SpreadsheetToolbar } from './SpreadsheetToolbar';
import { StatementSpreadsheetGrid, type SpreadsheetRow } from './StatementSpreadsheetGrid';

const rows: SpreadsheetRow[] = [{ id: 'row-1', rowNumber: 1, date: '02-04-2024', description: 'Coffee' }];

describe('import profile editor components', () => {
  it('renders the spreadsheet grid with row and column headers', () => {
    render(<StatementSpreadsheetGrid columns={[{ key: 'date', name: 'Date' }, { key: 'description', name: 'Description' }]} rows={rows} />);
    expect(screen.getByTestId('statement-spreadsheet-grid')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('02-04-2024')).toBeInTheDocument();
  });

  it('renders the spreadsheet toolbar', () => {
    render(<SpreadsheetToolbar profileName="Axis profile" onProfileNameChange={vi.fn()} onFileSelected={vi.fn()} sheets={['Sheet0']} selectedSheet="Sheet0" onSelectedSheetChange={vi.fn()} />);
    expect(screen.getByLabelText('Profile name')).toHaveValue('Axis profile');
    expect(screen.getByText('Sheet0')).toBeInTheDocument();
  });

  it('renders mapping controls', () => {
    render(<ColumnMappingPanel headers={['Tran Date', 'PARTICULARS']} mapping={{ date: 0 }} onMappingChange={vi.fn()} />);
    expect(screen.getByLabelText('Transaction date *')).toHaveTextContent('Tran Date');
    expect(screen.getByLabelText('Description / tag')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes / narration')).toBeInTheDocument();
  });

  it('renders profile rules checklist', () => {
    render(
      <ProfileRuleSummary
        mappedFields={['Date', 'Description']}
        problems={[]}
        checklist={[
          { label: 'Profile name', done: true },
          { label: 'Date column', done: true },
        ]}
      />
    );
    expect(screen.getByText('Profile rules')).toBeInTheDocument();
    expect(screen.getByText('Profile name')).toBeInTheDocument();
    expect(screen.getByText('Date column')).toBeInTheDocument();
  });

  it('renders validation totals', () => {
    render(<ImportValidationSummary validRows={9} excludedRows={31} invalidRows={0} duplicateRows={2} />);
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('31')).toBeInTheDocument();
    expect(screen.getByText('Duplicates')).toBeInTheDocument();
  });
});
