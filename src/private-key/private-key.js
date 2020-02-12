import * as WIF from './wallet-import-format.js'
import * as Address from '../address/address.js'
import { Buffer } from '../../../buffer-js/buffer.js'

export default class PrivateKey {

    constructor(buffer) {
        this._buffer = buffer
    }

    toAddress(network) {
        return Address.privateKeyToP2PKH(this._buffer, network)
    }

    toWIF() {
        return WIF.encode(this._buffer)
    }

    static async fromWIF(encoded, network) {
        const decoded = await WIF.decode(encoded, network)
        return new PrivateKey(decoded)
    }

    static generate() {
        const bytes = Buffer.randomBytes(32)
        return new this.prototype.constructor(bytes.toBigInt())
    }

}

export class TestnetPrivateKey extends PrivateKey {

    toAddress() {
        return super.toAddress('TESTNET')
    }

    toWIF() {
        return WIF.encode(this._buffer, 'TESTNET')
    }

}