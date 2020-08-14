import { pbkdf2 } from '../../../hash-js/src/pbkdf2/pdkdf2.js'
import { Buffer } from '../../../buffer-js/buffer.js'


/**
 * Derive a seed from a mnemonic phrase.
 * 
 * @param  {String} mnemonic The mnemonic phrase.
 * @param  {String} password The password decrypting the phrase.
 * @return {Buffer}          The derived seed.
 */
export async function mnemonicToSeed(mnemonic, password) {
    const mnemonicBuffer = Buffer.fromUnicode(mnemonic)
    
    password = 'mnemonic' + (password || '')
    const saltBuffer = Buffer.fromUnicode(password)
    
    const seedBuffer = await pbkdf2(mnemonicBuffer, saltBuffer, 'SHA-512', 2048, 64)
    const seed = new Buffer(seedBuffer)
    return seed
}
