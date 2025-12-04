import { describe, it, expect } from 'vitest';
import { getWhatsAppUrl, getPhoneUrl, fmtMXN, parseNum, clamp } from './utils';

describe('Lib Utils', () => {

    describe('getWhatsAppUrl', () => {
        it('returns undefined for empty or invalid inputs', () => {
            expect(getWhatsAppUrl('')).toBeUndefined();
            expect(getWhatsAppUrl(undefined)).toBeUndefined();
            expect(getWhatsAppUrl('123')).toBeUndefined(); // Too short
        });

        it('formats 10-digit Mexican numbers correctly (adds 52 prefix)', () => {
            // Input: 656 123 4567 -> Output: https://wa.me/526561234567...
            const url = getWhatsAppUrl('6561234567');
            expect(url).toContain('wa.me/526561234567');
        });

        it('respects numbers that already have the 52 prefix', () => {
            // Input: 52 656 123 4567 -> Output: https://wa.me/526561234567... (no double 52)
            const url = getWhatsAppUrl('526561234567');
            expect(url).toContain('wa.me/526561234567');
        });

        it('sanitizes input with spaces, dashes, and parentheses', () => {
            const dirtyNumber = '+52 (656) 123-4567';
            const url = getWhatsAppUrl(dirtyNumber);
            expect(url).toContain('wa.me/526561234567');
        });

        it('encodes the message parameter correctly', () => {
            const phone = '6561234567';
            const message = 'Hola, quiero concreto f’c 200';
            const url = getWhatsAppUrl(phone, message);

            // Expect URL encoded characters (space -> %20, etc)
            expect(url).toContain('text=Hola%2C%20quiero%20concreto%20f%E2%80%99c%20200');
        });
    });

    describe('getPhoneUrl', () => {
        it('returns undefined for empty inputs', () => {
            expect(getPhoneUrl('')).toBeUndefined();
            expect(getPhoneUrl(undefined)).toBeUndefined();
        });

        it('generates a valid tel: URI', () => {
            expect(getPhoneUrl('6561234567')).toBe('tel:6561234567');
        });

        it('sanitizes non-numeric characters but keeps the + sign', () => {
            // Should allow + for international dialing codes logic inside util
            // Based on current implementation which keeps +, check regex behavior:
            // Current utils.ts: phone.replace(/[^\d+]/g, "")

            const input = '+52 (656) 123-4567';
            expect(getPhoneUrl(input)).toBe('tel:+526561234567');
        });
    });

    describe('Formatting Helpers', () => {
        it('fmtMXN formats currency correctly', () => {
            // Using a regex to match non-breaking spaces or standard spaces in output
            // Output usually: "$ 1,250.50" or "$1,250.50" depending on locale node version
            const result = fmtMXN(1250.5);
            expect(result).toMatch(/\$1,250\.50/);
        });

        it('parseNum handles strings with commas', () => {
            expect(parseNum('1,250.50')).toBe(1250.5);
            expect(parseNum('$ 200')).toBe(200);
            expect(parseNum('invalid')).toBe(0);
        });

        it('clamp restricts values within range', () => {
            expect(clamp(5, 0, 10)).toBe(5); // in range
            expect(clamp(-5, 0, 10)).toBe(0); // too low
            expect(clamp(15, 0, 10)).toBe(10); // too high
        });
    });

});
