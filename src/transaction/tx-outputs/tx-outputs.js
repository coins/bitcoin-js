import { SerialBuffer, VarInt, Uint64 } from '../../../../buffer-js/buffer.js'
import { addressToScriptPubKey } from '../../keys/address/address.js'
import { Script } from '../bitcoin-script/bitcoin-script.js'

/**
 * Class managing the outputs of a transaction.
 */
export class TxOutputs extends SerialBuffer {

    /**
     * @param {TxOutput[]} outputs 
     */
    constructor(outputs = []) {
        super()
        this.outputs = outputs;
    }

    /**
     * Read bytes from a reader.
     * @param {SerialReader} reader - The Reader to read from.
     * @return {TxOutputs} - The read TxOutputs instance.
     */
    static read(reader) {
        const outCount = VarInt.read(reader)
        const outputs = []
        for (let i = 0; i < outCount; i++) {
            const output = TxOutput.read(reader)
            outputs.push(output)
        }
        return new TxOutputs(outputs)
    }

    /**
     * @override
     */
    write(writer) {
        this.outputsCount.write(writer)
        this.outputs.forEach(output => output.write(writer))
    }

    /**
     * @override
     */
    byteLength() {
        return this.outputsCount.byteLength() + this.outputs.reduce(
            (sum, output) => sum + output.byteLength(), 0)
    }

    /**
     * The number of outputs as VarInt.
     * @return {VarInt}
     */
    get outputsCount() {
        return new VarInt(this.outputs.length)
    }

    /**
     * Add an output to this transaction.
     * 
     * @param {number} value - The output's value.
     * @param {string} address - The output's address.
     */
    add(value, address) {
        const scriptPubKey = addressToScriptPubKey(address)
        const output = TxOutput.fromHex(value, scriptPubKey)
        this.outputs.push(output)
    }
}


/**
 * Class to represent a transaction output.
 */
class TxOutput extends SerialBuffer {

    /**
     * The value of this output. 
     * It is denoted in Satoshis ( 1 sat = 1e-8 BTC ).
     * @type {TxValue}
     */
    //value

    /**
     * The locking script for this output.
     * @type {Script}
     */
    //scriptPubKey

    /**
     * Create a transaction output.
     * @param  {TxValue} value - The outputs value in Satoshis.
     * @param  {Script} scriptPubKey - The locking script.
     */
    constructor(value, scriptPubKey) {
        super()
        this.value = value
        this.scriptPubKey = scriptPubKey
    }

    /**
     * Create a transaction output from a hex encoded locking script.
     * @param {number} value - The outputs value in Satoshis.
     * @param {string} scriptPubKeyHex - The hex-encoded locking script.
     */
    static fromHex(value, scriptPubKeyHex) {
        const txValue = new TxValue(value)
        const scriptPubKey = Script.fromHex(scriptPubKeyHex)
        return new TxOutput(txValue, scriptPubKey)
    }

    /**
     * Read bytes from a reader.
     * @param {SerialReader} reader - The Reader to read from.
     * @return {TxOutput} - The read TxOutput instance.
     */
    static read(reader) {
        const value = TxValue.read(reader)
        const scriptPubKey = Script.read(reader)
        return new TxOutput(value, scriptPubKey)
    }

    /**
     * @override
     */
    write(writer) {
        this.value.write(writer)
        this.scriptPubKey.write(writer)
    }

    /**
     * @override
     */
    byteLength() {
        return this.value.byteLength() + this.scriptPubKey.byteLength()
    }
}

/**
 * Class to represent the value of an output.
 */
class TxValue extends Uint64 {

    /**
     * Convert value denominated in Satoshis into Bitcoins. 
     * @return {Number}
     */
    toBitcoins() {
        return Number(this.value) / 1e8
    }

}