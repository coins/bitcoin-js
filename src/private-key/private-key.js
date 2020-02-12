import * as WIF from './wallet-import-format.js'
import * as Address from '../address/address.js'
import { Buffer } from '../../../buffer-js/buffer.js'

export default class PrivateKey {

    constructor(buffer) {
        this._buffer = buffer
    }

    toAddress() {
        return Address.privateKeyToP2PKH(this._buffer)
    }

    toWIF() {
        return WIF.encode(this._buffer)
    }

    static async fromWIF(encoded) {
        const decoded = await WIF.decode(encoded)
        return new PrivateKey(decoded)
    }

    static generate() {
        const bytes = Buffer.randomBytes(32)
        return new PrivateKey(bytes.toBigInt())
    }

}