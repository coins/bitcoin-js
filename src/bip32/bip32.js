import { hmac_sha512,SHA256d } from '../../../hash-js/hash.js'
import { Buffer } from '../../../buffer-js/buffer.js'
import { concat } from '../../../buffer-js/src/buffer-utils/buffer-utils.js'

/*
	BIP32 Implementation 
	@see https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#master-key-generation
 */

/**
 * 
 * Convert a seed to a Master Private Key
 * @param  {Buffer} seed The seed.
 * @return {Buffer}      The corresponding Master Private Key.
 */
export async function seedToMasterKey(seed) {

    const I = await hmac_sha512(Buffer.fromUnicode('Bitcoin seed'), seed)

    const privateKey = I.slice(0, 32)
    const chainCode = I.slice(32)

    const version = '0488ADE4'
    const depth = '00'
    const parentFingerprint = '00000000'
    const childNumber = '00000000'

    const preamble = Buffer.fromHex(version + depth + parentFingerprint + childNumber)
    const privKey = concat(Buffer.fromHex('00'), privateKey)
    const serialized = concat(preamble, concat(chainCode, privKey))

    // 3 and 4 - Perform double SHA-256 hash on the serialized data
    const hash = await SHA256d.hash(serialized)

    // 5 - Take the first 4 bytes of the second SHA-256 hash, this is the checksum
    const checksum = hash.slice(0, 4)

    // 6 - Add the 4 checksum bytes from point 5 at the end of the serialized data
    const result = concat(serialized,checksum)

    return new Buffer(result)
}