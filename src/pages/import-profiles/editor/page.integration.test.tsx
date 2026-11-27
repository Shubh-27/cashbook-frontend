import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { ImportProfileEditorPage } from './page';
import { api } from '@/api';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/api', () => ({ api: { previewImportProfile: vi.fn(), createVersionedImportProfile: vi.fn(), updateVersionedImportProfile: vi.fn(), getVersionedImportProfile: vi.fn() } }));
const preview = { cell_value_format: 'formatted_text' as const, file_type: 'csv', worksheets: ['CSV'], selected_worksheet: 'CSV', first_rows: [{ row_number: 1, cells: ['Metadata', '', '', ''] }, { row_number: 2, cells: ['Date', 'Description', 'Debit', 'Credit'] }, { row_number: 3, cells: ['02-04-2024', 'Coffee', '350', '-'] }], last_rows: [{ row_number: 480, cells: ['11-12-2024', 'Salary', '-', '1000'] }, { row_number: 508, cells: ['12-12-2024', 'Last transaction', '-', '50'] }, { row_number: 509, cells: ['footer', '', '', ''] }], divider_after_row: 3, total_rows: 509, detected_header_row: 2, footer_candidate_rows: [509], secondary_table_candidate_rows: [], has_ambiguous_date_format: false };
const renderPage = (path = '/import-profiles/new') => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/import-profiles" element={<div>Profiles list</div>} />
      <Route path="/import-profiles/new" element={<ImportProfileEditorPage />} />
      <Route path="/import-profiles/:profileSID" element={<ImportProfileEditorPage />} />
    </Routes>
  </MemoryRouter>
);
const upload = async () => { fireEvent.change(screen.getByLabelText('Sample statement'), { target: { files: [new File(['sample'], 'sample.csv', { type: 'text/csv' })] } }); await waitFor(() => expect(api.previewImportProfile).toHaveBeenCalled()); };
const selectOption = (label: string, optionName: string) => {
  fireEvent.click(screen.getByLabelText(label));
  fireEvent.click(screen.getByRole('option', { name: optionName }));
};

describe('ImportProfileEditorPage integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(api.previewImportProfile).mockResolvedValue(preview);
    vi.mocked(api.createVersionedImportProfile).mockResolvedValue({ import_profile_sid: 'saved-profile', version_number: 1 });
    vi.mocked(api.updateVersionedImportProfile).mockResolvedValue({ import_profile_sid: 'saved-profile', version_number: 2 });
    vi.mocked(api.getVersionedImportProfile).mockResolvedValue({
      import_profile_sid: 'saved-profile', version_number: 1, name: 'Saved profile', file_type: 'csv', worksheet_name: 'CSV', header_row: 2, end_row: 508, date_format: 'dd-MM-yyyy', date: 0, description: 1, debit: 2,
      sample: { top_rows: preview.first_rows.map(row => ({ row_number: row.row_number, values: row.cells })), bottom_rows: preview.last_rows.map(row => ({ row_number: row.row_number, values: row.cells })), transaction_end_row: 508 },
    });
  });

  it('a. uploads and renders real row numbers, collapsed pre-header divider, and hidden gap divider', async () => {
    renderPage();
    await upload();
    expect((await screen.findAllByText('02-04-2024')).length).toBeGreaterThan(0);
    expect(screen.getByText(/above header/)).toBeInTheDocument();
    const divider = screen.getByText('… 503 rows hidden …');
    const lastFirstBlockRow = screen.getAllByText('02-04-2024')[0];
    const firstLastBlockRow = screen.getAllByText('11-12-2024')[0];
    expect(lastFirstBlockRow.compareDocumentPosition(divider) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(divider.compareDocumentPosition(firstLastBlockRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('keeps an index-mapped badge on the same column after header selection changes', async () => {
    renderPage();
    await upload();
    selectOption('Transaction date *', 'Date');
    expect(screen.getAllByText('Date').length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByText('02-04-2024')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Set as header' }));
    expect(screen.getAllByText('Date').length).toBeGreaterThan(0);
  });

  it('b. applies header styling to a selected final-block row and updates column labels', async () => {
    renderPage();
    await upload();

    fireEvent.click(screen.getByRole('gridcell', { name: '11-12-2024' }));
    fireEvent.click(screen.getByRole('button', { name: 'Set as header' }));

    expect(screen.getByRole('gridcell', { name: '11-12-2024' }).closest('[role="row"]')).toHaveClass('border-l-teal-700');
    expect(screen.queryByRole('gridcell', { name: 'Date' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /11-12-2024/ })).toBeInTheDocument();
  });

  it('c. excludes rows after the selected end row and reset restores the detected end row', async () => {
    renderPage();
    await upload();

    const endRow = screen.getByRole('gridcell', { name: '02-04-2024' }).closest('[role="row"]');
    const laterRow = screen.getByRole('gridcell', { name: '11-12-2024' }).closest('[role="row"]');
    fireEvent.click(screen.getByRole('gridcell', { name: '02-04-2024' }));
    fireEvent.click(screen.getByRole('button', { name: 'Transactions end here' }));

    expect(endRow).toHaveClass('border-teal-500');
    expect(endRow).not.toHaveClass('text-slate-400');
    expect(laterRow).toHaveClass('text-slate-400');

    fireEvent.click(screen.getByRole('button', { name: 'Reset to detected' }));
    expect(laterRow).not.toHaveClass('text-slate-400');
  });

  it('d. maps date and description fields by clicking their grid column headers', async () => {
    renderPage();
    await upload();

    fireEvent.click(screen.getByRole('button', { name: 'Transaction date *' }));
    fireEvent.click(screen.getByRole('button', { name: /Date$/ }));

    expect(screen.getByLabelText('Transaction date *')).toHaveTextContent('Date');
    expect(screen.getByRole('button', { name: /Date Date/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Description / tag' }));
    fireEvent.click(screen.getByRole('button', { name: /Description$/ }));

    expect(screen.getByLabelText('Description / tag')).toHaveTextContent('Description');
    expect(screen.getByRole('button', { name: /Description Description/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Date Date/ })).toBeInTheDocument();
  });

  it('e. swaps the prior field when the same column is mapped to Description', async () => {
    renderPage();
    await upload();

    fireEvent.click(screen.getByRole('button', { name: 'Transaction date *' }));
    fireEvent.click(screen.getByRole('button', { name: /Description$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Description / tag' }));
    fireEvent.click(screen.getByRole('button', { name: /Description$/ }));

    expect(screen.getByLabelText('Transaction date *')).toHaveTextContent('Not mapped');
    expect(screen.getByLabelText('Description / tag')).toHaveTextContent('Description');
    expect(screen.getByRole('button', { name: /Description Description/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Date Description/ })).not.toBeInTheDocument();
  });

  it('f. updates the parsed result table after mapping Debit and Credit and after clearing Debit', async () => {
    renderPage();
    await upload();

    fireEvent.click(screen.getByRole('button', { name: 'Transaction date *' }));
    fireEvent.click(screen.getByRole('button', { name: /Date$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Description / tag' }));
    fireEvent.click(screen.getByRole('button', { name: /Description$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Debit / withdrawal' }));
    fireEvent.click(screen.getByRole('button', { name: /Debit$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Credit / deposit' }));
    fireEvent.click(screen.getByRole('button', { name: /Credit$/ }));
    selectOption('Date format', 'DD-MM-YYYY');

    const parsedResult = screen.getByText('Parsed result').closest('section')!;
    expect(within(parsedResult).getByText('02 Apr 2024')).toBeInTheDocument();
    expect(within(parsedResult).getByText('Coffee')).toBeInTheDocument();
    expect(within(parsedResult).getByText('₹350.00')).toBeInTheDocument();

    selectOption('Debit / withdrawal', 'Not mapped');
    expect(within(parsedResult).getByText('11 Dec 2024')).toBeInTheDocument();
    expect(within(parsedResult).getByText('Salary')).toBeInTheDocument();
    expect(within(parsedResult).getByText('₹1000.00')).toBeInTheDocument();
  });

  it('g. requires a date format for an ambiguous preview before the profile is ready', async () => {
    vi.mocked(api.previewImportProfile).mockResolvedValue({ ...preview, has_ambiguous_date_format: true });
    renderPage();
    await upload();

    fireEvent.change(screen.getByLabelText('Profile name'), { target: { value: 'Ambiguous CSV' } });
    fireEvent.click(screen.getByRole('gridcell', { name: 'Date' }));
    fireEvent.click(screen.getByRole('button', { name: 'Set as header' }));
    fireEvent.click(screen.getByRole('gridcell', { name: '11-12-2024' }));
    fireEvent.click(screen.getByRole('button', { name: 'Transactions end here' }));
    fireEvent.click(screen.getByRole('button', { name: 'Transaction date *' }));
    fireEvent.click(screen.getByRole('button', { name: /Date$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Description / tag' }));
    fireEvent.click(screen.getByRole('button', { name: /Description$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Debit / withdrawal' }));
    fireEvent.click(screen.getByRole('button', { name: /Debit$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Credit / deposit' }));
    fireEvent.click(screen.getByRole('button', { name: /Credit$/ }));

    expect(screen.getByText('Ambiguous, please choose a date format before saving.')).toBeInTheDocument();
    fireEvent.blur(screen.getByLabelText('Profile name'));
    expect(screen.getByText('Choose a date format for ambiguous dates.')).toBeInTheDocument();

    selectOption('Date format', 'DD-MM-YYYY');
    expect(screen.queryByText('Ambiguous, please choose a date format before saving.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeEnabled();
  });

  it('h. renders typed preview errors, a generic fallback, and recovers on the next upload', async () => {
    vi.mocked(api.previewImportProfile).mockRejectedValueOnce(Object.assign(new Error(''), { code: 'file_too_large' }));
    renderPage();
    await upload();

    expect(await screen.findByRole('alert')).toHaveTextContent('This file is larger than 10 MB.');
    expect(screen.queryByTestId('statement-spreadsheet-grid')).not.toBeInTheDocument();

    await upload();
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(screen.getByTestId('statement-spreadsheet-grid')).toBeInTheDocument();

    vi.mocked(api.previewImportProfile).mockRejectedValueOnce(Object.assign(new Error(''), { code: 'unsupported_file' }));
    await upload();
    expect(await screen.findByRole('alert')).toHaveTextContent('Use a valid CSV, XLS, or XLSX file.');

    vi.mocked(api.previewImportProfile).mockRejectedValueOnce(Object.assign(new Error(''), { code: 'unknown_preview_error' }));
    await upload();
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to read this file.');
  });

  it('i. resets to the server header and footerCandidateRows[0] - 1 end row while keeping mappings', async () => {
    renderPage();
    await upload();

    fireEvent.click(screen.getByRole('button', { name: 'Transaction date *' }));
    fireEvent.click(screen.getByRole('button', { name: /Date$/ }));
    fireEvent.click(screen.getByRole('gridcell', { name: '02-04-2024' }));
    fireEvent.click(screen.getByRole('button', { name: 'Set as header' }));
    fireEvent.click(screen.getByRole('gridcell', { name: '11-12-2024' }));
    fireEvent.click(screen.getByRole('button', { name: 'Transactions end here' }));

    fireEvent.click(screen.getByRole('button', { name: 'Reset to detected' }));

    expect(screen.getByRole('gridcell', { name: 'Date' }).closest('[role="row"]')).toHaveClass('border-l-teal-700');
    expect(screen.getByRole('gridcell', { name: '12-12-2024' }).closest('[role="row"]')).toHaveClass('border-teal-500');
    expect(screen.getByLabelText('Transaction date *')).toHaveTextContent('Date');
    expect(screen.getByRole('button', { name: /Date Date/ })).toBeInTheDocument();
  });

  it('j. creates a valid profile without writing uploaded editor state to browser storage', async () => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    const setItem = vi.spyOn(window.Storage.prototype, 'setItem');
    renderPage();
    await upload();

    fireEvent.change(screen.getByLabelText('Profile name'), { target: { value: 'My CSV profile' } });
    fireEvent.click(screen.getByRole('gridcell', { name: 'Date' }));
    fireEvent.click(screen.getByRole('button', { name: 'Set as header' }));
    fireEvent.click(screen.getByRole('gridcell', { name: '11-12-2024' }));
    fireEvent.click(screen.getByRole('button', { name: 'Transactions end here' }));
    fireEvent.click(screen.getByRole('button', { name: 'Transaction date *' }));
    fireEvent.click(screen.getByRole('button', { name: /Date$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Description / tag' }));
    fireEvent.click(screen.getByRole('button', { name: /Description$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Debit / withdrawal' }));
    fireEvent.click(screen.getByRole('button', { name: /Debit$/ }));

    const saveButton = screen.getByRole('button', { name: 'Save profile' });
    expect(saveButton).toBeEnabled();
    fireEvent.click(saveButton);
    await waitFor(() => expect(api.createVersionedImportProfile).toHaveBeenCalledWith(expect.any(File), expect.objectContaining({ name: 'My CSV profile', header_row: 2, end_row: 480, date: 0, description: 1, debit: 2 })));
    expect(toast.success).toHaveBeenCalledWith('Profile saved as version 1.');
    expect(await screen.findByText('Profiles list')).toBeInTheDocument();
    expect(setItem).not.toHaveBeenCalled();
    expect(window.localStorage).toHaveLength(0);
    expect(window.sessionStorage).toHaveLength(0);
    setItem.mockRestore();
  });

  it('loads a saved profile into the editor without requesting an unmasked file', async () => {
    vi.mocked(api.getVersionedImportProfile).mockResolvedValue({
      import_profile_sid: 'saved-profile', version_number: 2, name: 'Saved profile', file_type: 'csv', worksheet_name: 'CSV', header_row: 2, end_row: 508, date_format: 'dd-MM-yyyy', date: 0, description: 1, debit: 2, credit: 3,
      sample: { top_rows: preview.first_rows.map(row => ({ row_number: row.row_number, values: row.cells })), bottom_rows: preview.last_rows.map(row => ({ row_number: row.row_number, values: row.cells })), transaction_end_row: 508 },
    });

    renderPage('/import-profiles/saved-profile');

    expect(await screen.findByDisplayValue('Saved profile')).toBeInTheDocument();
    expect(screen.getByLabelText('Transaction date *')).toHaveTextContent('Date');
    expect(screen.getByLabelText('Description / tag')).toHaveTextContent('Description');
    expect(api.previewImportProfile).not.toHaveBeenCalled();
  });

  it('updates a loaded profile without re-uploading the original file', async () => {
    renderPage('/import-profiles/saved-profile');
    await screen.findByDisplayValue('Saved profile');

    fireEvent.change(screen.getByLabelText('Profile name'), { target: { value: 'Renamed profile' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));

    await waitFor(() => expect(api.updateVersionedImportProfile).toHaveBeenCalledWith('saved-profile', expect.objectContaining({ name: 'Renamed profile', header_row: 2, end_row: 508, date: 0, description: 1, debit: 2 }), undefined));
    expect(toast.success).toHaveBeenCalledWith('Profile saved as version 2.');
    expect(await screen.findByText('Profiles list')).toBeInTheDocument();
  });
});
