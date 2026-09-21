import { describe, expect, it } from 'vitest';
import { isValidNewsletterEmail, normalizeNewsletterEmail } from '@/lib/newsletter';

describe('newsletter email handling', () => {
  it('trims and normalizes a subscriber email', () => {
    expect(normalizeNewsletterEmail('  Customer@Example.COM  ')).toBe('customer@example.com');
  });

  it.each([
    '',
    'not-an-email',
    'missing-domain@',
    '@missing-local.co.za',
    'spaces are@invalid.co.za',
  ])('rejects invalid email %j', (email) => {
    expect(isValidNewsletterEmail(email)).toBe(false);
  });

  it.each([
    'hello@bashcutz.co.za',
    'customer+updates@example.com',
    'NAME@EXAMPLE.CO.ZA',
  ])('accepts valid email %j', (email) => {
    expect(isValidNewsletterEmail(email)).toBe(true);
  });
});

