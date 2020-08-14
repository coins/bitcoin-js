import { Buffer, SerialBuffer, VarInt, Uint64, Uint32, Uint8, SerialReader } from '../../../buffer-js/buffer.js'
import { SerialSHA256d } from '../../../hash-js/hash.js'
import { Script } from './bitcoin-script/bitcoin-script.js'
import { SighashFlag } from '../keys/bitcoin-signature/bitcoin-signature.js'

import { TxInputs } from './tx-inputs/tx-inputs.js'
import { TxOutputs } from './tx-outputs/tx-outputs.js'

export class Transaction extends SerialBuffer {

    /**
     * The version of this transaction.
     * @type {Uint32} 
     */
    // version

    /**
     * The inputs of this transaction.
     * @type {TxInputs}
     */
    // inputs

    /**
     * The outputs of this transaction.
     * @type {TxOutputs}
     */
    // outputs

    /**
     * The lock time of this transaction.
     * @type {Uint32}
     */
    // lockTime


    /**
     * @override
     */
    byteLength() {
        return this.version.byteLength() +
            this.inputs.byteLength() +
            this.outputs.byteLength() +
            this.lockTime.byteLength()
    }

    /**
     * @override
     */
    write(writer) {
        this.version.write(writer)
        this.inputs.write(writer)
        this.outputs.write(writer)
        this.lockTime.write(writer)
    }

    /**
     * 
     * Read a Transaction from a byte reader.
     * 
     * @param {SerialReader} reader - the Reader to read from.
     * @return {Transaction}
     * @override
     */
    static read(reader) {
        const version = Uint32.read(reader)
        const marker = VarInt.read(reader)

        reader.meta.version = version
        reader.meta.isSegWit = (marker == 0)

        if (reader.meta.isSegWit) {
            return SegWitTransaction.read(reader)
        } else {
            reader.meta.inputsLength = marker
            return StandardTransaction.read(reader)
        }
    }

    /**
     * Create a copy of this Transaction.
     * @return {Transaction}
     */
    copy() {
        return Transaction.read(new SerialReader(this.toBuffer()))
    }

    /**
     * Copy a transaction to compute its signature hash.
     * 
     * @param  {number} inputIndex - Index of the input to sign.
     * @param  {SigHashFlag} sigHashFlag - The signature flag.
     * @param  {string} publicKeyScript - The hex encoded publicKeyScript.
     * @return {string} - The hex encoded copy 
     */
    sigHashCopy(inputIndex, sigHashFlag, publicKeyScript) {
        const txCopy = this.copy()
        txCopy.inputs.emptyScripts()
        txCopy.inputs.setScript(inputIndex, Script.fromHex(publicKeyScript))
        const sighashFlagHex = (new Uint32(sigHashFlag)).toHex()
        const hex = txCopy.toHex() + sighashFlagHex
        return hex
    }

    sigHashAllCopy(inputIndex, publicKeyScript) {
        return this.sigHashCopy(inputIndex, SighashFlag.SIGHASH_ALL, publicKeyScript)
    }

    toString() {
        return this.version.toString() +
            this.inputs.toString() +
            this.outputs.toString() +
            this.lockTime.toString()
    }
}


/** 
 * @extends Transaction
 */
export class StandardTransaction extends Transaction {

    /**
     * @param  {Uint32?} version - The version of this transaction.
     * @param  {TxInputs?} inputs - The inputs of this transaction.
     * @param  {TxOutputs?} outputs - The outputs of this transaction.
     * @param  {Uint32?} lockTime - The lock time of this transaction.
     */
    constructor(version, inputs, outputs, lockTime) {
        super()
        // TODO: this should be private fields
        this.version = version || new Uint32(1)
        this.inputs = inputs || new TxInputs()
        this.outputs = outputs || new TxOutputs()
        this.lockTime = lockTime || new Uint32(0)
    }

    /** 
     * The TXID of this transaction.
     * @return {Promise<SerialSHA256d>} 
     */
    async id() {
        const txCopy = this.toBuffer()
        return SerialSHA256d.hash(txCopy)
    }

    /**
     * @override
     */
    static read(reader) {
        const version = reader.meta.version
        const inputs = TxInputs.read(reader)
        const outputs = TxOutputs.read(reader)
        const lockTime = Uint32.read(reader)
        return new StandardTransaction(version, inputs, outputs, lockTime)
    }

}


export class SegWitTransaction extends Transaction {

    constructor(version, inputs, outputs, witnesses, lockTime) {
        super()
        this.version = new Uint32(version)
        this.marker = new Uint8(0)
        this.flag = new Uint8(1)
        this.inputs = inputs
        this.outputs = outputs
        this.witnesses = witnesses
        this.lockTime = lockTime
    }

    async id() {
        const txCopy = this.toBuffer()
        return SHA256d(txCopy)
    }

    write(writer) {
        switch (writer.mode) {
            case 'TXID':
                return super.write(writer)
            default:
                return this.writeAll(writer)
        }
    }

    writeAll(writer) {
        this.version.write(writer)
        this.marker.write(writer)
        this.flag.write(writer)
        this.inputs.write(writer)
        this.outputs.write(writer)
        this.witnesses.write(writer)
        this.lockTime.write(writer)
    }

    byteLength() {
        return this.version.byteLength() +
            this.marker.byteLength() +
            this.flag.byteLength() +
            this.inputs.byteLength() +
            this.outputs.byteLength() +
            this.witnesses.byteLength() +
            this.lockTime.byteLength();
    }

    static read(reader) {
        const version = reader.meta.version
        const flag = Uint8.read(reader)
        const inputs = TxInputs.read(reader)
        const outputs = TxOutputs.read(reader)
        const witnesses = Witnesses.read(reader)
        const lockTime = Uint32.read(reader)
        return new SegWitTransaction(version, inputs, outputs, witnesses, lockTime)
    }
}