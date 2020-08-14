import { pbkdf2 } from '../../../hash-js/src/pbkdf2/pdkdf2.js'
import { SHA256 } from '../../../hash-js/hash.js'
import { Buffer } from '../../../buffer-js/buffer.js'
import { concat } from '../../../buffer-js/src/buffer-utils/buffer-utils.js'
import { WORDLIST_ENGLISH } from './wordlists/wordlist-english.js'

const wordlist = WORDLIST_ENGLISH.split('\n')

/**
 * Derive a mnemonic phrase from entropy.
 * @param  {Buffer} entropy The entropy. 
 * @return {Promise<String>}         The mnemonic phrase.
 */
export async function entropyToMnemonic(entropy) {

    const checksumBits = await deriveChecksumBits(entropy)

    const bits = entropy.toBinary() + checksumBits

    const chunks = bits.match(/(.{1,11})/g)
    const words = chunks.map(binary => {
        const index = parseInt(binary, 2)
        return wordlist[index]
    })

    const mnemonic = words.join(' ')
    return mnemonic
}


async function deriveChecksumBits(entropy) {
    const ENT = entropy.length * 8
    const CS = ENT / 32
    const hash = await SHA256.hash(entropy)
    const bits = hash.toBinary()
    return bits.slice(0, CS)
}


/**
 * Derive a seed from a mnemonic phrase.
 * 
 * @param  {String} mnemonic The mnemonic phrase.
 * @param  {String} password The password decrypting the phrase. (Default is the empty string)
 * @return {Promise<Buffer>}     The derived seed.
 */
export async function mnemonicToSeed(mnemonic, password = '') {
    const mnemonicBuffer = Buffer.fromUnicode(mnemonic)

    password = 'mnemonic' + password
    const saltBuffer = Buffer.fromUnicode(password)

    const seedBuffer = await pbkdf2(mnemonicBuffer, saltBuffer, 'SHA-512', 2048, 64)
    const seed = new Buffer(seedBuffer)
    return seed
}


/**
 * Generate a mnemonic phrase.
 * @param  {Number} security The security in bits. (default is 128 bits)
 * @return {Promise<String>}	The mnemonic phrase.
 */
export async function generateMnemonic(security = 128) {
    const entropy = Buffer.randomBytes(security / 8)
    return entropyToMnemonic(entropy)
}