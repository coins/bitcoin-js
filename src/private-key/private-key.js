import * as WIF from './wallet-import-format.js'
import * as Address from '../address/address.js'
import { Buffer } from '../../../buffer-js/buffer.js'
import * as ECDSA from '../../../elliptic-js/src/signatures/ecdsa-signature.js'
import { Secp256k1 } from '../../../elliptic-js/src/secp256k1/secp256k1.js'

/**
 * Symbol to protect private class members.
 * @type {Symbol} - The private symbol.
 */
const PRIVATE = Symbol('PRIVATE')

export class PrivateKey {

    constructor(privateKey) {
        this[PRIVATE] = {
            privateKey: privateKey
        }
    }

    /**
     * Converts this private key to a Bitcoin address address.
     * 
     * @param  {String?} network - the address' network.
     * @return {String} 
     */
    toAddress(network = 'MAINNET') {
        return Address.privateKeyToP2PKH(this[PRIVATE].privateKey, network)
    }

    /**
     * Exports the private key in WIF.
     * 
     * @return {Promise<String>} - The WIF encoded private key.
     */
    export (network = 'MAINNET') {
        return WIF.encode(this[PRIVATE].privateKey, network)
    }

    /**
     * Import a private key from WIF.
     * 
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
     * 
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
    async sign(transaction, inputIndex, sigHashFlag = 1) {
        let txCopy = new Buffer(transaction.toBuffer())
        txCopy = Buffer.fromHex(txCopy.toHex() + '01') // TODO: care for sighashflag somewhere else
        const signature = await ECDSA.sign(txCopy, this[PRIVATE].privateKey)
        transaction.addWitness(inputIndex, this.publicKey, signature)
        return transaction
    }

    get publicKey() {
        return Secp256k1.publicKey(this[PRIVATE].privateKey)
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
        return super.export('TESTNET')
    }

    /**
     * @override
     */
    static import(encoded) {
        return super.import(encoded, 'TESTNET')
    }
}