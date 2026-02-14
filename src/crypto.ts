import * as fernet from 'fernet'

export class CryptoClient {
	private secret: fernet.Secret

	constructor(key: string) {
		this.secret = new fernet.Secret(key)
	}

	encrypt(data: unknown): string {
		const token = new fernet.Token({
			secret: this.secret,
			time: Date.now(),
			iv: undefined,
		})

		return token.encode(JSON.stringify(data))
	}

	decrypt(tokenStr: string): any {
		const token = new fernet.Token({
			secret: this.secret,
			token: tokenStr,
			ttl: 0,
		})

		const decoded = token.decode()
		return JSON.parse(decoded)
	}
}
