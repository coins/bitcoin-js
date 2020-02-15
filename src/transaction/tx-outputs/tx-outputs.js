import { Buffer, SerialBuffer, VarInt, Uint64, Uint32, Uint8, SerialReader } from '../../../../buffer-js/buffer.js'
import { addressToScriptPubKey } from '../../keys/address/address.js'
import { Script } from '../bitcoin-script/bitcoin-script.js'

/**
 * Class managing the outputs of a transaction.
 */
export class TxOutputs {

    constructor(outputs = []) {
        this.outputs = outputs;
    }

    /**
     * The number of outputs as VarInt.
     * @return {VarInt}
     */
    get outputsCount() {
        return new VarInt(this.outputs.length)
    }

    write(writer) {
        this.outputsCount.write(writer)
        this.outputs.forEach(output => output.write(writer))
    }

    byteLength() {
        return this.outputsCount.byteLength() + this.outputs.reduce(
            (sum, output) => sum + output.byteLength(), 0)
    }

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
     *
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

class TxOutput {

    constructor(value, scriptPubKey) {
        this.value = value
        this.scriptPubKey = scriptPubKey
    }

    static fromHex(value, scriptPubKeyHex) {
        const txValue = new TxValue(value)
        const scriptPubKey = Script.fromHex(scriptPubKeyHex)
        return new TxOutput(txValue, scriptPubKey)
    }

    write(writer) {
        this.value.write(writer)
        this.scriptPubKey.write(writer)
    }

    byteLength() {
        return this.value.byteLength() + this.scriptPubKey.byteLength()
    }

    static read(reader) {
        const value = TxValue.read(reader)
        const scriptPubKey = Script.read(reader)
        return new TxOutput(value, scriptPubKey)
    }

}

class TxValue extends Uint64 {

    toBitcoins() {
        return Number(this.txValue.value) / 1e8
    }

}