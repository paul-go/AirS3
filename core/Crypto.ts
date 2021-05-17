
namespace AirS3
{
	/**
	 * A namespace of utility functions that handle the crypto operations
	 * required in order to create signed S3 requests.
	 */
	export namespace Crypto
	{
		/** */
		export async function shaHex(plain: string | ArrayBuffer)
		{
			try
			{
				const plainBytes = toBytes(plain);
				const sha = await window.crypto.subtle.digest("SHA-256", plainBytes);
				return toHexString(sha);
			}
			catch (e)
			{
				debugger;
				return null as never;
			}
		}
		
		/**
		 * 
		 */
		export async function hmacShaHex(
			key: string | Uint8Array,
			plain: string | Uint8Array)
		{
			const bytes = await hmacShaBytes(key, plain);
			return toHexString(bytes);
		}
		
		/**
		 * 
		 */
		export async function hmacShaBytes(
			key: string | Uint8Array,
			plain: string | Uint8Array)
		{
			let cryptoKey: CryptoKey;
			
			if (typeof key === "string")
			{
				const existing = cryptoKeys.get(key);
				if (existing)
				{
					cryptoKey = existing;
				}
				else
				{
					cryptoKey = await importHmacShaKey(key);
					cryptoKeys.set(key, cryptoKey);
				}
			}
			else cryptoKey = await importHmacShaKey(key);
			
			const signatureBuffer = await window.crypto.subtle.sign(
				"HMAC",
				cryptoKey,
				toBytes(plain));
			
			return new Uint8Array(signatureBuffer);
		}
		
		/**
		 * Converts the specified raw key string to an CryptoKey capable
		 * of generating HMAC SHA-256 digests. The characters of the key
		 * provided are converted into their ASCII representations before
		 * the CryptoKey object is created.
		 */
		async function importHmacShaKey(key: string | Uint8Array)
		{
			const keyBytes = toBytes(key);
			const cryptoKey = await window.crypto.subtle.importKey(
				"raw",
				keyBytes,
				{
					name: "HMAC",
					hash: "SHA-256",
				},
				true,
				["sign", "verify"]);
			
			return cryptoKey;
		}
		
		/** */
		function toBytes(plain: string | ArrayBuffer)
		{
			return typeof plain === "string" ?
				new TextEncoder().encode(plain) :
				plain;
		}
		
		/** */
		function toHexString(byteArray: ArrayBuffer)
		{
			return Array.prototype.map.call(byteArray, byte =>
			{
				return ("0" + (byte & 0xFF).toString(16)).slice(-2);
			}).join("");
		}
		
		/**
		 * Stores a mapping of raw keys to crypto keys, so that we can avoid
		 * having to recreate them every time for encryption or decryption
		 * operation.
		 */
		const cryptoKeys = new Map<string, CryptoKey>();
	}
}
