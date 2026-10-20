/**
 * Input validation.
 *
 * Every API route describes the fields it accepts with the rule builders
 * below. `validate()` checks all fields at once and, if anything is wrong,
 * throws a 422 error listing a friendly message for each bad field so the
 * form can highlight them.
 */

import { HttpError } from './http-utils.js';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../shared/constants.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Removes invisible control characters but keeps tabs and line breaks.
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function isMissing(value) {
  return value === undefined || value === null || value === '';
}

/** A trimmed string with length limits. */
export function text({ label, min = 1, max = 200, required = true, fallback = '' }) {
  return (value) => {
    if (isMissing(value)) {
      return required ? { error: `${label} is required.` } : { value: fallback };
    }
    if (typeof value !== 'string') {
      return { error: `${label} must be text.` };
    }
    const cleaned = value.replace(CONTROL_CHARACTERS, '').trim();
    if (cleaned.length === 0 && required) {
      return { error: `${label} is required.` };
    }
    if (cleaned.length < min) {
      return { error: `${label} must be at least ${min} characters.` };
    }
    if (cleaned.length > max) {
      return { error: `${label} must be ${max} characters or fewer.` };
    }
    return { value: cleaned };
  };
}

/** A whole number within a range. Accepts numbers or numeric strings. */
export function integer({ label, min = -Infinity, max = Infinity, required = true, fallback = null }) {
  return (value) => {
    if (isMissing(value)) {
      return required ? { error: `${label} is required.` } : { value: fallback };
    }
    const number = typeof value === 'string' ? Number(value) : value;
    if (!Number.isInteger(number)) {
      return { error: `${label} must be a whole number.` };
    }
    if (number < min || number > max) {
      return { error: `${label} must be between ${min} and ${max}.` };
    }
    return { value: number };
  };
}

/** One value from a fixed list, such as a category id. */
export function oneOf({ label, options, required = true, fallback = null }) {
  const ids = options.map((option) => (typeof option === 'string' ? option : option.id));
  return (value) => {
    if (isMissing(value)) {
      return required ? { error: `${label} is required.` } : { value: fallback };
    }
    if (!ids.includes(value)) {
      return { error: `Choose a valid ${label.toLowerCase()}.` };
    }
    return { value };
  };
}

export function email({ label = 'Email' } = {}) {
  return (value) => {
    if (isMissing(value)) return { error: `${label} is required.` };
    if (typeof value !== 'string') return { error: `${label} must be text.` };
    const cleaned = value.trim().toLowerCase();
    if (cleaned.length > 254 || !EMAIL_PATTERN.test(cleaned)) {
      return { error: 'Enter a valid email address, like name@school.edu.' };
    }
    return { value: cleaned };
  };
}

export function boolean({ fallback = false } = {}) {
  return (value) => {
    if (isMissing(value)) return { value: fallback };
    if (typeof value !== 'boolean') return { error: 'Must be true or false.' };
    return { value };
  };
}

/** A moment in time sent as milliseconds since 1970 (JavaScript's Date.now()). */
export function timestamp({ label }) {
  return (value) => {
    const number = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(number) || number <= 0) {
      return { error: `${label} is required.` };
    }
    return { value: Math.round(number) };
  };
}

/** Runs every rule in `schema` against `input`. Throws 422 on failure. */
export function validate(input, schema) {
  const values = {};
  const errors = {};
  const source = input && typeof input === 'object' ? input : {};

  for (const [field, rule] of Object.entries(schema)) {
    const result = rule(source[field]);
    if (result.error) {
      errors[field] = result.error;
    } else {
      values[field] = result.value;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new HttpError(422, 'Please fix the highlighted fields.', errors);
  }
  return values;
}

/** Parses a route parameter such as `:id`. */
export function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(404, 'Not found.');
  }
  return id;
}

/*
 * Password rules follow NIST SP 800-63B-4: require length instead of
 * forced symbols, allow long passphrases, and block passwords that are
 * common or obviously tied to this site or the user.
 */
const COMMON_PASSWORDS = new Set([
  'passwordpassword',
  'password1234567',
  'password12345678',
  '123456789012345',
  '1234567890123456',
  '111111111111111',
  'qwertyuiopasdfg',
  'qwertyuiopasdfgh',
  'qwertyuiop123456',
  'iloveyouiloveyou',
  'letmeinletmein1',
  'welcome12345678',
  'abcdefghijklmno',
  'abcdefghijklmnop',
  'trustno1trustno1',
  'football12345678',
  'baseball12345678',
  'administrator123',
  'changemechangeme',
  'correcthorsebatterystaple',
]);

const SITE_WORDS = ['commons', 'lakeside'];

export function passwordProblem(password, { email: userEmail = '', name = '' } = {}) {
  if (typeof password !== 'string' || password.length === 0) {
    return 'Password is required.';
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters. A short phrase works well.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Use ${PASSWORD_MAX_LENGTH} characters or fewer.`;
  }

  const lower = password.toLowerCase();
  const compact = lower.replace(/[\s\-_.]/g, '');

  if (COMMON_PASSWORDS.has(compact)) {
    return 'That password is too common. Try a phrase only you would think of.';
  }
  if (/^(.)\1+$/.test(compact)) {
    return 'Avoid repeating a single character.';
  }
  if (SITE_WORDS.some((word) => lower.includes(word))) {
    return 'Avoid using the name of this site or school in your password.';
  }

  const emailName = userEmail.split('@')[0].toLowerCase();
  if (emailName.length >= 4 && lower.includes(emailName)) {
    return 'Avoid using your email address in your password.';
  }
  const firstName = name.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
  if (firstName.length >= 4 && compact.startsWith(firstName) && compact.length - firstName.length < 8) {
    return 'Avoid building your password mostly from your name.';
  }
  return null;
}
