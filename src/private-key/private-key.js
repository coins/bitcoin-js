import * as WIF from './wallet-import-format.js'
import * as Address from '../address/address.js'
import { Buffer } from '../../../buffer-js/buffer.js'

export default class PrivateKey {

    constructor(privateKey) {
        this._privateKey = privateKey
    }

    /**
     * Converts this private key to an address.
     * @param  {String?} network - the address' network.
     * @return {String} 
     */
    toAddress(network = 'MAINNET') {
        return Address.privateKeyToP2PKH(this._privateKey, network)
    }

    /**
     * Exports the private key in WIF
     * @return {Promise<String>} - The WIF encoded private key.
     */
    export (network = 'MAINNET') {
        return WIF.encode(this._privateKey, network)
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

    /**
     * Sign a transaction with this private key.
     * 
     * @param  {Transaction} transaction - the transaction to sign.
     * @param  {number} inputIndex - the index of the input to be unlocked.
     * @param  {SigHashFlag} sigHashFlag - the signature hash flag
     * @return {Transaction} - the signed transaction.
     */
    sign(transaction, inputIndex, sigHashFlag) {
        const txCopy = transaction.copyToSign(inputIndex, sigHashFlag)
        const signature = ECDSA.sign(this.privateKey, txCopy)
        transaction.addWitness(inputIndex, this.publicKey, signature)
        return transaction
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
    export () {
        return super.export(this.buffer, 'TESTNET')
    }

}