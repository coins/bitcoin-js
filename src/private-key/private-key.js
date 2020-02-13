import * as WIF from './wallet-import-format.js'
import * as Address from '../address/address.js'
import { Buffer } from '../../../buffer-js/buffer.js'

export default class PrivateKey {

    constructor(buffer) {
        this._buffer = buffer
    }

    /**
     * Converts this private key to an address.
     * @param  {String?} network - the address' network.
     * @return {String} 
     */
    toAddress(network = 'MAINNET') {
        return Address.privateKeyToP2PKH(this._buffer, network)
    }

    /**
     * Exports the private key in WIF
     * @return {Promise<String>} - The WIF encoded private key.
     */
    export () {
        return WIF.encode(this._buffer)
    }

    /**
     * Import a private key from WIF.
     * @param  {String} encoded - The WIF encoded private key.
     * @param  {String?} network - the address' network.
     * @return {PrivateKey} - the corresponding private key.
     */
    static async import(encoded, network = 'MAINNET') {
        const decoded = await WIF.decode(encoded, network)
        return new PrivateKey(decoded)
    }

    /**
     * Generate a new private key.
     * @return {PrivateKey} - The generated private key.
     */
    static generate() {
        const bytes = Buffer.randomBytes(32)
        return new this.prototype.constructor(bytes.toBigInt())
    }

}

export class TestnetPrivateKey extends PrivateKey {

    /**
     * @override
     */
    toAddress() {
        return super.toAddress('TESTNET')
    }

    /**
     * @override
     */
    export() {
        return WIF.encode(this._buffer, 'TESTNET')
    }

}