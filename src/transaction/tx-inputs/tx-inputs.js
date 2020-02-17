import { Buffer, SerialBuffer, VarInt, Uint64, Uint32, Uint8, SerialReader } from '../../../../buffer-js/buffer.js'
import { SerialSHA256d } from '../../../../hash-js/hash.js'
import { Script } from '../bitcoin-script/bitcoin-script.js'

/**
 * Class managing the inputs of a transaction.
 * @extends SerialBuffer
 */
export class TxInputs extends SerialBuffer {

    /**
     * The array of inputs managed here.
     * @type TxInput[]
     */
    _inputs

    /**
     * @param  {TxInput[]} inputs - An array of inputs.
     */
    constructor(inputs = []) {
        super()
        this._inputs = inputs
    }

    /**
     * Read inputs from a SerialReader
     * @param  {SerialReader}
     * @return {TxInputs}
     */
    static read(reader) {
        const inCount = reader.meta.inputsLength || VarInt.read(reader) // SegWit transactions
        reader.meta.inputsLength = inCount // inCount is also witnessCount
        const inputs = []
        for (let i = 0; i < inCount; i++) {
            const input = TxInput.read(reader)
            inputs.push(input)
        }
        return new TxInputs(inputs)
    }

    /**
     * @override
     */
    write(writer) {
        // 1 - Write the inputs count
        this.inputsCount.write(writer)

        // 2 - Write every input
        this._inputs.forEach(input => input.write(writer))
    }

    /**
     * @override
     */
    byteLength() {
        return this.inputsCount.byteLength() +
            this._inputs.reduce((sum, input) => sum + input.byteLength(), 0)
    }

    /**
     * The number of inputs as VarInt.
     * @return {VarInt}
     */
    get inputsCount() {
        return new VarInt(this._inputs.length)
    }

    /**
     * 
     * Add an input to spend in this transaction.
     * 
     * @param {string} prevTxOutHash - hash of the transaction that created the input.
     * @param {number} prevTxOutIndex - Output index within the transaction that created the input.
     * @param {string} scriptSig - The signature script to unlock the input.
     * @param {number?} sequence - The sequence number.
     */
    add(prevTxOutHash, prevTxOutIndex, scriptSig, sequence = 0xffffffff) {
        const input = TxInput.fromHex(prevTxOutHash, prevTxOutIndex, scriptSig, sequence)
        // add to list
        this._inputs.push(input)
    }

    /** 
     * Sets all inputs' scripts to be empty scripts.
     */
    emptyScripts() {
        this._inputs.forEach(input => input.setEmptyScript())
    }

    /** 
     * @param {number} inputIndex - The index of the input to set the script.
     * @param {Script} script - The script to set.
     */
    setScript(inputIndex, script) {
        this._inputs[inputIndex].scriptSig = script
    }

    /**
     * 
     * Add a witness to unlock an input.
     * 
     * @param {number} inputIndex - The index of the input to add a witness to.
     * @param {Buffer} publicKey - The public key which corresponds to the input's address.
     * @param {BitcoinSignature} signature - The signature unlocking the input.
     */
    addWitness(inputIndex, publicKey, signature) {
        const input = this._inputs[inputIndex]
        input.scriptSig.add(signature.toBuffer())
        input.scriptSig.add(publicKey)
    }
}


class TxInput {

    /**
     * The hash of the transaction creating the output to be spent in this input.
     * @type {SerialSHA256d}
     */
    prevTxOutHash

    /**
     * The output index of the output to be spent in this input. 
     * @type {Number}
     */
    prevTxOutIndex

    /**
     * The unlocking script.
     * @type {Script}
     */
    scriptSig

    /**
     * The input's sequence number.
     * @type {Uint32}
     */
    sequence

    constructor(prevTxOutHash, prevTxOutIndex, scriptSig, sequence = 0xffffffff) {
        this.prevTxOutHash = prevTxOutHash
        this.prevTxOutIndex = new Uint32(prevTxOutIndex)
        this.scriptSig = scriptSig
        this.sequence = new Uint32(sequence) // irrelevant unless transaction's lock_time is > 0
    }

    static fromHex(prevTxOutHash, prevTxOutIndex, scriptSig = '', sequence) {
        prevTxOutHash = SerialSHA256d.fromHex(prevTxOutHash).reverse() // reverse to fix satoshi's byte order
        scriptSig = Script.fromHex(scriptSig)
        return new TxInput(prevTxOutHash, prevTxOutIndex, scriptSig, sequence)
    }

    write(writer) {
        this.prevTxOutHash.write(writer);
        this.prevTxOutIndex.write(writer);
        // TODO
        // if(writer.meta.sigHash)
        //     execute script and then cut out everything until last OP_CODESEPARATOR
        this.scriptSig.write(writer);
        this.sequence.write(writer);
    }

    byteLength() {
        return this.prevTxOutHash.byteLength() +
            this.prevTxOutIndex.byteLength() +
            this.scriptSig.byteLength() +
            this.sequence.byteLength();
    }

    setEmptyScript() {
        this.scriptSig = Script.fromHex('')
    }

    static read(reader) {
        const prevTxOutHash = SerialSHA256d.read(reader);
        const prevTxOutIndex = Uint32.read(reader);
        const scriptSig = Script.read(reader);
        const sequence = Uint32.read(reader);
        return new TxInput(prevTxOutHash, prevTxOutIndex, scriptSig, sequence)
    }

}