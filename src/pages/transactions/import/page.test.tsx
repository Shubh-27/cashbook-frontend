import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StatementImportPage } from './page';
import { api } from '@/api';
import { useAppStore } from '@/store';
import type { StatementImportAnalysis } from '@/types';

const analysis: StatementImportAnalysis = {
  file_name: 'statement.csv',
  file_type: 'csv',
  file_hash: 'a'.repeat(64),
  sheets: ['CSV'],
  selected_sheet: 'CSV',
  header_row: 1,
  transaction_end_row: 2,
  header_candidates: [{ row_number: 1, score: 4, values: ['Date', 'Description', 'Debit'] }],
  headers: ['Date', 'Description', 'Debit'],
  mapping: { date: 'Date', description: 'Description', debit: 'Debit' },
  date_format: 'dd/MM/yyyy',
  metadata: {},
  suggested_profile_sid: 'profile-1',
  sample: { top_rows: [], bottom_rows: [], transaction_end_row: 2 },
  rows: [
    {
      row_number: 2,
      transaction_date: '2024-04-02T00:00:00.000Z',
      description: 'Coffee',
      debit: 350,
      credit: null,
      balance: null,
      notes: null,
      include: true,
      status: 'new',
      issues: [],
    },
  ],
};

describe('StatementImportPage', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    HTMLElement.prototype.hasPointerCapture = vi.fn();
    useAppStore.setState({
      accounts: [
        {
          account_sid: 'account-1',
          account_name: 'Primary account',
          account_number: null,
          bank_name: null,
          transaction_count: 0,
          status: 1,
        },
      ],
      fetchAccounts: vi.fn().mockResolvedValue(undefined),
      fetchDescriptions: vi.fn().mockResolvedValue(undefined),
      refreshTransactions: vi.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('uses the selected saved profile and analysis file hash when importing transactions', async () => {
    vi.spyOn(api, 'getImportProfiles').mockResolvedValue([
      {
        import_profile_sid: 'profile-1',
        name: 'Primary bank CSV',
        file_type: 'csv',
        header_row: 1,
        headers: [],
        mapping: {},
      },
    ]);
    vi.spyOn(api, 'analyzeStatement').mockResolvedValue(analysis);
    vi.spyOn(api, 'commitStatementImport').mockResolvedValue({
      import_batch_sid: 'batch-1',
      imported_rows: 1,
      skipped_duplicate_rows: 0,
      invalid_rows: 0,
    });

    render(
      <MemoryRouter initialEntries={['/transactions/import']}>
        <Routes>
          <Route path="/transactions" element={<div>Transactions list</div>} />
          <Route path="/transactions/import" element={<StatementImportPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Statement file *'), {
      target: { files: [new File(['statement'], 'statement.csv', { type: 'text/csv' })] },
    });
    fireEvent.click(screen.getByRole('combobox', { name: 'Import profile *' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Primary bank CSV' }));
    fireEvent.click(screen.getByRole('button', { name: 'Analyze statement' }));

    await waitFor(() =>
      expect(api.analyzeStatement).toHaveBeenCalledWith(
        expect.any(File),
        expect.objectContaining({ profileSID: 'profile-1', accountSID: 'account-1' }),
      ),
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Import transactions' }));

    await waitFor(() =>
      expect(api.commitStatementImport).toHaveBeenCalledWith(
        expect.objectContaining({
          account_sid: 'account-1',
          profile_sid: 'profile-1',
          file_hash: 'a'.repeat(64),
          rows: analysis.rows,
        }),
      ),
    );
    await screen.findByText('Transactions list');
  });
});
