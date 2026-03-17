export type ValidationRule = {
  validate: (value: any) => boolean;
  message: string;
};

export const rules = {
  required: (message = 'This field is required'): ValidationRule => ({
    validate: (val) => val !== undefined && val !== null && val.toString().trim() !== '',
    message,
  }),
  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (val) => !val || val.toString().length >= min,
    message: message || `Minimum ${min} characters required`,
  }),
  numeric: (message = 'Must be a numeric value'): ValidationRule => ({
    validate: (val) => !val || /^[0-9]*$/.test(val.toString()),
    message,
  }),
  minAmount: (min: number, message?: string): ValidationRule => ({
    validate: (val) => !val || parseFloat(val) >= min,
    message: message || `Amount must be at least ${min}`,
  }),
};

export function validateField(value: any, fieldRules: ValidationRule[]): string | null {
  for (const rule of fieldRules) {
    if (!rule.validate(value)) {
      return rule.message;
    }
  }
  return null;
}

export type ValidationErrors = Record<string, string[]>;

export class ValidationError extends Error {
  errors: ValidationErrors;
  constructor(message: string, errors: ValidationErrors) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}
