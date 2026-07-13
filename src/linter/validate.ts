import type { Config } from '../config/defaultConfig.js';
import {
  parseCommitMessage,
  validateType,
  validateScope,
  validateLength,
  validateDescription,
  type ValidationError,
} from './rules.js';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validateCommitMessage(message: string, config: Config): ValidationResult {
  const errors: ValidationError[] = [];

  // Parse the commit message
  const parsed = parseCommitMessage(message);

  if (!parsed) {
    return {
      valid: false,
      errors: [
        {
          rule: 'format',
          message: 'Commit message must follow the format: type(scope): description',
        },
      ],
    };
  }

  // Run all validation rules
  const typeError = validateType(parsed, config);
  if (typeError) errors.push(typeError);

  const scopeError = validateScope(parsed, config);
  if (scopeError) errors.push(scopeError);

  const lengthError = validateLength(parsed, config);
  if (lengthError) errors.push(lengthError);

  const descError = validateDescription(parsed);
  if (descError) errors.push(descError);

  return {
    valid: errors.length === 0,
    errors,
  };
}
