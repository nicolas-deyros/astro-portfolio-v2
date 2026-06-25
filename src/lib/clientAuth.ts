const ITERATIONS = 100_000
const KEY_BITS = 256
const HASH_ALG = 'SHA-256'
const SALT_BYTES = 16
const SETUP_TOKEN_BYTES = 32

/**
 * Generate a high-entropy, URL-safe setup token (raw value emailed to the
 * client). Only its SHA-256 hash is stored — see `hashToken`.
 */
export function generateSetupToken(): string {
	const array = new Uint8Array(SETUP_TOKEN_BYTES)
	crypto.getRandomValues(array)
	return btoa(String.fromCharCode(...array))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '')
}

/**
 * SHA-256 hash of a high-entropy token, hex-encoded. No salt needed: the token
 * itself is random, so this only prevents a DB leak from exposing usable links.
 */
export async function hashToken(raw: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
	return Array.from(new Uint8Array(digest))
		.map(b => b.toString(16).padStart(2, '0'))
		.join('')
}

/**
 * Hash a plain-text password using PBKDF2 via Web Crypto (crypto.subtle).
 * Returns a `base64salt:base64hash` string suitable for DB storage.
 */
export async function hashPassword(plain: string): Promise<string> {
	const saltArray = new Uint8Array(SALT_BYTES)
	crypto.getRandomValues(saltArray)

	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(plain),
		'PBKDF2',
		false,
		['deriveBits'],
	)

	const derived = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', salt: saltArray, iterations: ITERATIONS, hash: HASH_ALG },
		keyMaterial,
		KEY_BITS,
	)

	const saltB64 = btoa(String.fromCharCode(...saltArray))
	const hashB64 = btoa(String.fromCharCode(...new Uint8Array(derived)))

	return `${saltB64}:${hashB64}`
}

/**
 * Verify a plain-text password against a stored `base64salt:base64hash` string.
 * Uses a constant-time comparison to prevent timing attacks.
 */
export async function verifyPassword(
	plain: string,
	stored: string,
): Promise<boolean> {
	const colonIdx = stored.indexOf(':')
	if (colonIdx === -1) return false

	const saltB64 = stored.slice(0, colonIdx)
	const expectedB64 = stored.slice(colonIdx + 1)

	let saltArray: Uint8Array<ArrayBuffer>
	try {
		const saltStr = atob(saltB64)
		saltArray = new Uint8Array(saltStr.length)
		for (let i = 0; i < saltStr.length; i++) {
			saltArray[i] = saltStr.charCodeAt(i)
		}
	} catch {
		return false
	}

	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(plain),
		'PBKDF2',
		false,
		['deriveBits'],
	)

	const derived = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', salt: saltArray, iterations: ITERATIONS, hash: HASH_ALG },
		keyMaterial,
		KEY_BITS,
	)

	const actualB64 = btoa(String.fromCharCode(...new Uint8Array(derived)))

	// Constant-time comparison
	if (actualB64.length !== expectedB64.length) return false
	let diff = 0
	for (let i = 0; i < actualB64.length; i++) {
		diff |= actualB64.charCodeAt(i) ^ expectedB64.charCodeAt(i)
	}
	return diff === 0
}
