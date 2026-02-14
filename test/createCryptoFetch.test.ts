import { describe, expect, test } from 'bun:test'
import { createCryptoFetch } from '../src/createCryptoFetch'

function generateFernetKey(): string {
	const bytes = new Uint8Array(32)
	crypto.getRandomValues(bytes)
	return btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '')
}

describe('createCryptoFetch', () => {
	const key = generateFernetKey()
	const cryptoFetch = createCryptoFetch({ key })

	test('skips excluded paths', async () => {
		const cryptoFetchExcluded = createCryptoFetch({
			key,
			excludedPaths: ['/health'],
		})

		const originalFetch = globalThis.fetch
		let capturedBody: string | undefined
		globalThis.fetch = async (_input, init?: RequestInit) => {
			capturedBody = init?.body as string
			return new Response(JSON.stringify({ ok: true }), {
				headers: { 'Content-Type': 'application/json' },
			})
		}

		try {
			await cryptoFetchExcluded('https://example.com/health', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ping: true }),
			})
			expect(capturedBody).toBe(JSON.stringify({ ping: true }))
		} finally {
			globalThis.fetch = originalFetch
		}
	})

	test('passes through non-JSON requests unchanged', async () => {
		const originalFetch = globalThis.fetch
		let capturedBody: string | undefined
		globalThis.fetch = async (_input, init?: RequestInit) => {
			capturedBody = init?.body as string
			return new Response('ok', { headers: {} })
		}

		try {
			await cryptoFetch('https://example.com/form', {
				method: 'POST',
				headers: { 'Content-Type': 'text/plain' },
				body: 'plain text',
			})
			expect(capturedBody).toBe('plain text')
		} finally {
			globalThis.fetch = originalFetch
		}
	})

	test('encrypts JSON body for non-excluded paths', async () => {
		const cryptoFetchWithExclusion = createCryptoFetch({
			key,
			excludedPaths: ['/health'],
		})

		const originalFetch = globalThis.fetch
		let capturedBody: string | undefined
		globalThis.fetch = async (_input, init?: RequestInit) => {
			capturedBody = init?.body as string
			return new Response(JSON.stringify({ ok: true }), {
				headers: { 'Content-Type': 'application/json' },
			})
		}

		try {
			await cryptoFetchWithExclusion('https://example.com/api/data', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ secret: 'value' }),
			})
			const parsed = JSON.parse(capturedBody!)
			expect(parsed).toHaveProperty('encrypted')
			expect(typeof parsed.encrypted).toBe('string')
			expect(parsed.encrypted).not.toContain('secret')
		} finally {
			globalThis.fetch = originalFetch
		}
	})
})
