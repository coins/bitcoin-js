/**
 * @version 0.0.1
 * @see https://en.bitcoin.it/wiki/Wallet_import_format
 */

import { Buffer } from '../../../buffer-js/buffer.js'
import { SHA256d } from '../../../hash-js/hash.js'


/**
 * The network version byte for private keys.
 * @type {Map<string,string>}
 */
export const NETWORK_VERSION = {
    MAINNET: '80',
    TESTNET: 'ef',
}

/**
 * @param  {BigInt} - The private key as BigInt.
 * @param  {String} - The private key's network.
 * @return {Promise<String>} - The WIF encoded private key.
 */
export async function encode(bigint, network = 'MAINNET') {
    // 1 - Take a private key
    const privateKey = Buffer.fromBigInt(bigint).toHex()

    // 2 - Add a 0x80 byte in front of it for mainnet addresses or 0xef for testnet addresses. 
    // Also add a 0x01 byte at the end if the private key will correspond to a compressed public key
    const extendedKey = NETWORK_VERSION[network] + privateKey // TODO: check network and add '01' for compressed keys 

    // 3 and 4 - Perform double SHA-256 hash on the extended key
    const hash = await SHA256d.hashHex(extendedKey)

    // 5 - Take the first 4 bytes of the second SHA-256 hash, this is the checksum
    const checksum = hash.slice(0, 4).toHex()

    // 6 - Add the 4 checksum bytes from point 5 at the end of the extended key from point 2
    const result = extendedKey + checksum

    // 7 - Convert the result from a byte string into a base58 string using Base58Check encoding. 
    // This is the Wallet Import Format
    return Buffer.fromHex(result).toBase58()
}

/**
 * @param  {String} - The WIF encoded private key.
 * @param  {String} - The private key's network.
 * @return {Promise<BigInt>} - The private key as BigInt.
 */
export async function decode(stringWIF, network = 'MAINNET') {
    // 1 - Take a Wallet Import Format string

    // 2 - Convert it to a byte string using Base58Check encoding
    const bytes = Buffer.fromBase58(stringWIF)

    // 3 - Drop the last 4 checksum bytes from the byte string
    const shortened = bytes.slice(0, bytes.size() - 4)
    const checksum = bytes.slice(bytes.size() - 4)

    // 4 - Perform double SHA-256 hash on the shortened string
    const hash = await SHA256d.hash(shortened)

    // 5 - Take the first 4 bytes of the second SHA-256 hash, this is the checksum
    const checksumResult = hash.slice(0, 4)

    // 6 - Make sure it is the same, as the last 4 bytes from point 3
    if (!checksum.equals(checksumResult)) throw Error('Checksum mismatch!')

    // 7 - If they are, and the byte string from point 2 starts with 0x80 (0xef for testnet addresses), then there is no error.
    const networkByte = shortened.slice(0, 1) // TODO: Check network
    const privateKey = shortened.slice(1)
    return privateKey.toBigInt()
}