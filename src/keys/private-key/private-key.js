import { Buffer } from '../../../../buffer-js/buffer.js'
import * as ECDSA from '../../../../elliptic-js/src/signatures/ecdsa-signature.js'
import { Secp256k1 } from '../../../../elliptic-js/src/secp256k1/secp256k1.js'
import * as WIF from '../wallet-import-format/wallet-import-format.js'
import * as Address from '../address/address.js'
import { BitcoinSignature, SighashFlag } from '../bitcoin-signature/bitcoin-signature.js'


import { Transaction } from '../../transaction/transaction.js'



const MAINNET = 'MAINNET'
const TESTNET = 'TESTNET'

/**
 * Class to represent a private key.
 */
export class PrivateKey {

    /**
     * @param {BigInt} private key - The private key.
     * @param {string} network - The network of the private key.
     */
    constructor(privateKey, network = MAINNET) {
        /**
         * The raw private key in BigInt format.
         * It uses a hack to represent private class members 
         * ( see the definition of PRIVATE at the end of this file )
         * 
         * @type BigInt privateKey 
         * @private
         */
        this[PRIVATE] = {
            privateKey: privateKey,
            network: network
        }
    }

    /**
     * Converts this private key to a Bitcoin address.
     * 
     * @param  {String?} network - the address' network.
     * @return {String} 
     */
    toAddress() {
        return Address.privateKeyToP2PKH(this[PRIVATE].privateKey, this[PRIVATE].network)
    }

    /**
     * Exports this private key in WIF.
     * 
     * @return {Promise<String>} - The WIF encoded private key.
     */
    export () {
        return WIF.encode(this[PRIVATE].privateKey, this[PRIVATE].network)
    }

    /**
     * Import a private key from WIF.
     * 
     * @param  {String} encoded - The WIF encoded private key.
     * @param  {String?} network - the address' network to check against.
     * @return {PrivateKey} - the corresponding private key.
     */
    static async import(encoded, network) {
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
     * The corresponding public key.
     * @return {Buffer}
     */
    get publicKey() {
        return Secp256k1.publicKey(this[PRIVATE].privateKey)
    }

    /**
     * Sign a transaction with this private key.
     * 
     * @param  {Transaction} transaction - the transaction to sign.
     * @param  {number} inputIndex - the index of the input to be unlocked.
     * @param  {SigHashFlag} sigHashFlag - the signature hash flag
     * @return {Transaction} - the signed transaction.
     */
    async signTransaction(transaction, inputIndex, sigHashFlag = SighashFlag.SIGHASH_ALL) {
        const address = await this.toAddress()
        const publicKeyScript = Address.addressToScriptPubKey(address)
        console.log('pubKeyScript', publicKeyScript)
        let txCopy = await transaction.sigHashAllCopy(inputIndex, publicKeyScript)

        console.log('copy', txCopy, Transaction.fromHex(txCopy))

        txCopy = Buffer.fromHex(txCopy + sigHashFlag.toHex())
        const signatureDER = await ECDSA.sign(txCopy, this[PRIVATE].privateKey)
        const bitcoinSignature = new BitcoinSignature(signatureDER, sigHashFlag)
        transaction.inputs.addWitness(inputIndex, this.publicKey, bitcoinSignature)
        return transaction
    }
}

/**
 * Class to represent a private key for Bitcoin's Testnet.
 */
export class TestnetPrivateKey extends PrivateKey {

    /**
     * @param {BigInt} private key - The private key.
     */
    constructor(privateKey) {
        super(privateKey, TESTNET)
    }

    /**
     * Import a private key from WIF.
     * 
     * @param  {String} encoded - The WIF encoded private key.
     * @return {TestnetPrivateKey} - the corresponding private key.
     */
    static async import(encoded) {
        const decoded = await WIF.decode(encoded, TESTNET)
        return new TestnetPrivateKey(decoded) 
    }
}


/**
 * 
 * A Symbol to protect private class members from being accessed from outside of this module.
 * Note this is *not* really private. 
 * You can get symbols from a class using Object.getOwnPropertySymbols(obj).
 * Still this ensures this class does not leak its private key accidentally.
 * 
 * @see https://medium.com/@davidrhyswhite/private-members-in-es6-db1ccd6128a5
 * 
 * @type {Symbol} - The private symbol to hide private class members.
 */
const PRIVATE = Symbol('private-class-members')

