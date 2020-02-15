import { Secp256k1 } from '../../../elliptic-js/src/secp256k1/secp256k1.js'
import { HASH160, SHA256d } from '../../../hash-js/hash.js'
import { Buffer } from '../../../buffer-js/buffer.js'


/**
* The version byte to denote an address' network
*/
const NETWORK_VERSION = {
    'MAINNET': '00',
    'TESTNET': '6f'
}

/**
 * Generates a P2PKH address
 * P2PKH means "pay to public key hash" 
 * @param {BigInt} privateKey 
 * @return {String} p2pkhAddress 
 * @see https://en.bitcoin.it/wiki/Technical_background_of_Bitcoin_addresses
 */
export async function privateKeyToP2PKH(privateKey, network = 'MAINNET') {

    // 0 - Having a private ECDSA key
    // 1 - Take the corresponding public key generated with it 
    //         (33 bytes, 1 byte 0x02 (y-coord is even), 
    //         and 32 bytes corresponding to X coordinate)
    const publicKey = Secp256k1.publicKey(privateKey)

    // 2 - Perform SHA-256 hashing on the public key
    // 3 - Perform RIPEMD-160 hashing on the result of SHA-256
    const hash = await HASH160.hash(publicKey)

    // 4 - Add version byte in front of RIPEMD-160 hash (0x00 for Main Network)
    const versioned = NETWORK_VERSION[network] + hash.toHex()


    // (note that below steps are the Base58Check encoding, which has multiple library options available implementing it)

    // 5 - Perform SHA-256 hash on the extended RIPEMD-160 result
    // 6 - Perform SHA-256 hash on the result of the previous SHA-256 hash
    const versionedHash = await SHA256d.hashHex(versioned)

    // 7 - Take the first 4 bytes of the second SHA-256 hash. This is the address checksum
    const checksum = versionedHash.slice(0, 4)

    // 8 - Add the 4 checksum bytes from stage 7 at the end of extended RIPEMD-160 hash from stage 4. This is the 25-byte binary Bitcoin Address.
    const addressHex = versioned + checksum.toHex()

    // 9 - Convert the result from a byte string into a base58 string using Base58Check encoding. This is the most commonly used Bitcoin Address format
    return Buffer.fromHex(addressHex).toBase58()
}


/**
 * Converts an address into a scriptPubKey.
 * @param {String} address - The address base58 encoded. 
 * @return {String} - The scriptPubKey hex encoded.
 */
export function addressToScriptPubKey(address) {
    const addressBytes = Buffer.fromBase58(address)
    const version = addressBytes.slice(0, 1).toHex()

    // Cut off the version byte and the checksum to retrieve the hash.
    const hash = addressBytes.slice(1, 21).toHex()

    // Add opcodes.
    const OP_DUP = '76'
    const OP_HASH160 = 'a9'
    const OP_PUSH_20 = '14'
    const OP_EQUALVERIFY = '88'
    const OP_CHECKSIG = 'ac'
    return OP_DUP + OP_HASH160 + OP_PUSH_20 + hash + OP_EQUALVERIFY + OP_CHECKSIG
}

