import { describe, expect, test } from 'bun:test'
import { CryptoClient } from '../src/crypto'

// Generate a valid Fernet key (32 bytes, base64url encoded)
function generateFernetKey(): string {
	const bytes = new Uint8Array(32)
	crypto.getRandomValues(bytes)
	return btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '')
}

describe('CryptoClient', () => {
	const key = generateFernetKey()
	const crypto = new CryptoClient(key)

	test('encrypts and decrypts data correctly', () => {
		const data = { foo: 'bar', count: 42 }
		const encrypted = crypto.encrypt(data)
		expect(encrypted).toBeDefined()
		expect(typeof encrypted).toBe('string')
		expect(encrypted).not.toContain('foo')

		const decrypted = crypto.decrypt(encrypted)
		expect(decrypted).toEqual(data)
	})

	test('encrypts primitives', () => {
		const str = crypto.encrypt('hello')
		expect(crypto.decrypt(str)).toBe('hello')

		const num = crypto.encrypt(123)
		expect(crypto.decrypt(num)).toBe(123)
	})

	test('produces different ciphertext for same input (IV/timestamp)', () => {
		const data = { same: true }
		const a = crypto.encrypt(data)
		const b = crypto.encrypt(data)
		expect(a).not.toBe(b)
		expect(crypto.decrypt(a)).toEqual(data)
		expect(crypto.decrypt(b)).toEqual(data)
	})
})
