import type { Config } from '../config/defaultConfig.js';

export interface ValidationError {
  rule: string;
  message: string;
}

export interface ParsedCommit {
  type: string;
  scope?: string;
  description: string;
  raw: string;
}

export function parseCommitMessage(message: string): ParsedCommit | null {
  const trimmed = message.trim();

  // Match: type(scope): description or type: description
  const match = trimmed.match(/^(\w+)(\(([^)]+)\))?:\s*(.+)$/);

  if (!match) {
    return null;
  }

  const [, type, , scope, description] = match;

  const parsed: ParsedCommit = {
    type: type!,
    description: description!,
    raw: trimmed,
  };

  if (scope) {
    parsed.scope = scope;
  }

  return parsed;
}

export function validateType(parsed: ParsedCommit, config: Config): ValidationError | null {
  const allowedTypes = config.rules?.types || [];

  if (allowedTypes.length === 0) {
    return null;
  }

  if (!allowedTypes.includes(parsed.type)) {
    return {
      rule: 'type',
      message: `Type "${parsed.type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return null;
}

export function validateScope(parsed: ParsedCommit, config: Config): ValidationError | null {
  const requireScope = config.rules?.requireScope || false;
  const allowedScopes = config.rules?.scopes || [];

  if (requireScope && !parsed.scope) {
    return {
      rule: 'scope',
      message: 'Scope is required',
    };
  }

  if (parsed.scope && allowedScopes.length > 0 && !allowedScopes.includes(parsed.scope)) {
    return {
      rule: 'scope',
      message: `Scope "${parsed.scope}" is not allowed. Allowed scopes: ${allowedScopes.join(', ')}`,
    };
  }

  return null;
}

export function validateLength(parsed: ParsedCommit, config: Config): ValidationError | null {
  const maxLength = config.rules?.maxLength || 100;
  const minLength = config.rules?.minLength || 10;

  if (parsed.raw.length > maxLength) {
    return {
      rule: 'max-length',
      message: `Commit message is too long (${parsed.raw.length} > ${maxLength})`,
    };
  }

  if (parsed.raw.length < minLength) {
    return {
      rule: 'min-length',
      message: `Commit message is too short (${parsed.raw.length} < ${minLength})`,
    };
  }

  return null;
}

export function validateDescription(parsed: ParsedCommit): ValidationError | null {
  if (!parsed.description || parsed.description.trim() === '') {
    return {
      rule: 'description',
      message: 'Description cannot be empty',
    };
  }

  // Check if description starts with lowercase
  if (parsed.description[0] !== parsed.description[0]?.toLowerCase()) {
    return {
      rule: 'description-case',
      message: 'Description must start with lowercase',
    };
  }

  // Check if description ends with period
  if (parsed.description.endsWith('.')) {
    return {
      rule: 'description-period',
      message: 'Description must not end with a period',
    };
  }

  return null;
}
