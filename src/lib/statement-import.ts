export const statementDateFormats = [
  { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY', example: '23/11/2026' },
  { value: 'dd/MM/yy', label: 'DD/MM/YY', example: '23/11/26' },
  { value: 'dd-MM-yyyy', label: 'DD-MM-YYYY', example: '02-04-2024' },
  { value: 'dd-MM-yy', label: 'DD-MM-YY', example: '02-04-24' },
  { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY', example: '11/23/2026' },
  { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD', example: '2026-11-23' },
  { value: 'dd MMM yyyy', label: 'DD MMM YYYY', example: '23 Nov 2026' },
  { value: 'excel_serial', label: 'Excel serial', example: '46113 → 01 Apr 2026' },
] as const;

export const statementDateFormatLabel = (format: string | null | undefined) => {
  const match = statementDateFormats.find(option => option.value === format);
  return match ? `${match.label} (${match.example})` : 'Choose date format';
};
