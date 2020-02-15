import { Buffer, SerialBuffer, VarInt, Uint64, Uint32, Uint8, SerialReader } from '../../../buffer-js/buffer.js'
import { SerialSHA256d } from '../../../hash-js/hash.js'
import { addressToScriptPubKey } from '../address/address.js'
import { PublicKeyScript, SignatureScript, Script } from './bitcoin-script.js'

export class Transaction extends SerialBuffer {

    // TODO: make fields of class explicit

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
     * Read bytes from a reader.
     * 
     * @param {Reader} reader - the Reader to read from.
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
     * 
     * Add an input to spend in this transaction.
     * 
     * @param {string} prevTxOutHash - hash of the transaction that created the input.
     * @param {number} prevTxOutIndex - Output index within the transaction that created the input.
     * @param {string} scriptSig - The signature script to unlock the input.
     * @param {number?} sequence - The sequence number.
     */
    addInput(prevTxOutHash, prevTxOutIndex, scriptSig, sequence = 0xffffffff) {
        const input = TxInput.fromHex(prevTxOutHash, prevTxOutIndex, scriptSig, sequence)
        this.inputs.add(input)
    }

    /**
     * 
     * Add a witness to unlock an input.
     * 
     * @param {number} inputIndex - 
     * @param {Buffer} publicKey - The public key which corresponds to the input's address.
     * @param {BitcoinSignature} signature - The signature unlocking the input.
     */
    addWitness(inputIndex, publicKey, signature) {
        const input = this.inputs.inputs[inputIndex]
        input.scriptSig.add(signature.toBuffer())
        input.scriptSig.add(publicKey)
    }

    /**
     *
     * Add an output to this transaction.
     * 
     * @param {number} value - The output's value.
     * @param {string} address - The output's address.
     */
    addOutput(value, address) {
        const scriptPubKey = addressToScriptPubKey(address)
        const output = TxOutput.fromHex(value, scriptPubKey)
        this.outputs.add(output)
    }
    
    sigHashCopy(inputIndex, sigHashFlag, publicKeyScript) {
        const txCopy = this.copy()
        txCopy.inputs.inputs.forEach(input => input.setEmptyScript())
        txCopy.inputs.setScript(inputIndex, Script.fromHex(publicKeyScript))
        const hex = txCopy.toHex()
        return hex
    }

    copy() {
        return Transaction.read(new SerialReader(this.toBuffer()))
    }
}

export class StandardTransaction extends Transaction {

    constructor(version, inputs, outputs, lockTime = 0) {
        super()
        // TODO: this should be private fields
        this.version = version || new Uint32(1)
        this.inputs = inputs || new TxInputs()
        this.outputs = outputs || new TxOutputs()
        this.lockTime = new Uint32(lockTime)
    }

    async id() {
        const txCopy = this.toBuffer()
        return SerialSHA256d.hash(txCopy)
    }

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

class TxInputs {

    constructor(inputs = []) {
        this.inputs = inputs
        this.setInCount()
    }

    write(writer) {
        this.inCount.write(writer)
        this.inputs.forEach(input => input.write(writer))
    }

    byteLength() {
        return this.inCount.byteLength() +
            this.inputs.reduce((sum, input) => sum + input.byteLength(), 0)
    }

    static read(reader) {
        const inCount = reader.meta.inputsLength || VarInt.read(reader)
        reader.meta.inputsLength = inCount // inCount is also witnessCount
        const inputs = []
        for (let i = 0; i < inCount; i++) {
            const input = TxInput.read(reader)
            inputs.push(input)
        }
        return new TxInputs(inputs)
    }

    add(input) {
        this.inputs.push(input)
        this.setInCount()
    }

    setInCount() {
        this.inCount = new VarInt(this.inputs.length)
    }

    setScript(inputIndex, publicKeyScript) {
        this.inputs[inputIndex].scriptSig = publicKeyScript
    }
}

class TxInput {

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

class TxOutputs {

    constructor(outputs = []) {
        this.outputs = outputs;
        this.setOutCount()
    }

    setOutCount() {
        this.outCount = new VarInt(this.outputs.length)
    }

    write(writer) {
        this.outCount.write(writer)
        this.outputs.forEach(output => output.write(writer))
    }

    byteLength() {
        return this.outCount.byteLength() + this.outputs.reduce(
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

    add(output) {
        this.outputs.push(output)
        this.setOutCount()
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