import { CryptoClient } from './crypto'

type Config = {
	key: string
	excludedPaths?: string[]
	enableEncryption?: boolean
}

export function createCryptoFetch(config: Config) {
	const crypto = new CryptoClient(config.key)
	const excluded = config.excludedPaths ?? []
	const enableEncryption = config.enableEncryption ?? true

	return async function cryptoFetch(
		input: Request | string | URL,
		init: RequestInit = {}
	): Promise<Response> {
		const url =
			typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url

		// ---------- Skip excluded paths ----------
		if (excluded.some((p) => url.includes(p))) {
			return fetch(input, init)
		}

		let newInit: RequestInit = { ...init }

		// ---------- Encrypt Request ----------
		if (enableEncryption) {
			const contentType =
				(init.headers as Record<string, string>)?.['Content-Type'] ||
				(init.headers as Record<string, string>)?.['content-type']

			if (init.body && contentType?.includes('application/json')) {
				try {
					const body = JSON.parse(init.body as string)

					const encrypted = crypto.encrypt(body)

					newInit.body = JSON.stringify({
						encrypted,
					})
				} catch {}
			}
		}

		const response = await fetch(input, newInit)

		// ---------- Decrypt Response ----------
		if (!enableEncryption) return response

		const isEncrypted = response.headers.get('x-encrypted')

		if (!isEncrypted) return response

		const encryptedText = await response.text()

		const decrypted = crypto.decrypt(encryptedText)

		return new Response(JSON.stringify(decrypted), {
			status: response.status,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	}
}
