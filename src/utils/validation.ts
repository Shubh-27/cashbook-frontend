export type ValidationRule<T = unknown> = {
  validate: (value: T) => boolean;
  message: string;
};

export const rules = {
  required: (message = 'This field is required'): ValidationRule => ({
    validate: (val: unknown) => val !== undefined && val !== null && String(val).trim() !== '',
    message,
  }),
  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (val: unknown) => !val || String(val).length >= min,
    message: message || `Minimum ${min} characters required`,
  }),
  numeric: (message = 'Must be a numeric value'): ValidationRule => ({
    validate: (val: unknown) => !val || /^[0-9]*$/.test(String(val)),
    message,
  }),
  minAmount: (min: number, message?: string): ValidationRule => ({
    validate: (val: unknown) => {
      if (val === undefined || val === null || String(val).trim() === '') return true;
      const num = typeof val === 'number' ? val : parseFloat(String(val));
      return !isNaN(num) && num >= min;
    },
    message: message || `Amount must be at least ${min}`,
  }),
};

export function validateField<T = unknown>(value: T, fieldRules: ValidationRule<T>[]): string | null {
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
