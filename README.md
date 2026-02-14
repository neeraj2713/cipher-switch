# cipher-switch

A lightweight TypeScript library for transparently encrypting and decrypting HTTP request/response bodies using [Fernet](https://github.com/fernet/spec/blob/master/Spec.md) symmetric encryption. Drop-in replacement for `fetch` that keeps your API traffic encrypted in transit.

## Features

- **Automatic encryption** – JSON request bodies are encrypted before sending
- **Automatic decryption** – Responses with the `x-encrypted` header are decrypted transparently
- **Drop-in fetch replacement** – Use `createCryptoFetch` instead of `fetch` with minimal code changes
- **Path exclusions** – Skip encryption for specific URL paths (e.g. health checks, public endpoints)
- **Fernet encryption** – Industry-standard symmetric encryption with built-in timestamp validation

## Installation

```bash
bun add cipher-switch
```

Or with npm:

```bash
npm install cipher-switch
```

## Quick Start

```typescript
import { createCryptoFetch } from 'cipher-switch'

// Create a fetch function with your Fernet secret key
const cryptoFetch = createCryptoFetch({
	key: 'your-base64-fernet-key-here',
})

// Use it exactly like fetch
const response = await cryptoFetch('https://api.example.com/data', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ email: 'user@example.com', password: 'secret' }),
})

const data = await response.json()
// Data is automatically decrypted
```

## Configuration

```typescript
createCryptoFetch({
  key: string;                    // Required: Fernet secret key (base64)
  excludedPaths?: string[];       // Optional: URL paths to skip encryption
  enableEncryption?: boolean;     // Optional: Toggle encryption (default: true)
});
```

### Generating a Fernet Key

Fernet keys must be 32 bytes, base64url encoded. Generate one with:

```typescript
import { CryptoClient } from 'cipher-switch'

// Using Node.js crypto or Bun
const key = Buffer.from(crypto.randomBytes(32)).toString('base64url')
// Or: crypto.randomBytes(32).toString("base64url")
```

## API

### `createCryptoFetch(config)`

Returns an async function with the same signature as `fetch`. It:

1. **Encrypts** JSON request bodies when `Content-Type: application/json` is set
2. **Decrypts** responses that include the `x-encrypted` header
3. **Skips** URLs matching any `excludedPaths`
4. **Passes through** non-JSON requests and unencrypted responses unchanged

### `CryptoClient`

Lower-level API for direct encryption/decryption:

```typescript
import { CryptoClient } from 'cipher-switch'

const crypto = new CryptoClient('your-fernet-key')

// Encrypt any JSON-serializable data
const encrypted = crypto.encrypt({ foo: 'bar' })

// Decrypt a Fernet token
const decrypted = crypto.decrypt(encrypted)
```

## Server-Side Requirements

For end-to-end encryption, your API server must:

1. **Encrypt responses** using the same Fernet key
2. **Set the header** `x-encrypted: true` on encrypted responses
3. **Decrypt request bodies** that come in the format `{ encrypted: "<fernet-token>" }`

## Excluding Paths

Skip encryption for specific endpoints:

```typescript
const cryptoFetch = createCryptoFetch({
	key: process.env.FERNET_KEY!,
	excludedPaths: ['/health', '/public', '/metrics'],
})
```

## License

MIT
