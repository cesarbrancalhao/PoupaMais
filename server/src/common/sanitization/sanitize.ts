import { Transform } from 'class-transformer';
import sanitizeHtml = require('sanitize-html');

const STRICT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
  allowedSchemes: [],
  allowedSchemesByTag: {},
  allowedSchemesAppliedToAttributes: [],
};

export function sanitizeText(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return sanitizeHtml(value, STRICT_OPTIONS).trim();
}

export function SanitizeText() {
  return Transform(({ value }) => sanitizeText(value));
}
