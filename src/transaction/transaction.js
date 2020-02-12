import { SerialBuffer, VarInt, Uint64, Uint32, Uint8, SerialSHA256d } from '../../../buffer-js/src/serial-buffer/serial-buffer.js'
import { Buffer } from '../../../buffer-js/buffer.js'
import { PublicKeyScript, SignatureScript, Script } from './bitcoin-script.js'


export class Transaction extends SerialBuffer {

    byteLength() {
        return this.version.byteLength() +
            this.inputs.byteLength() +
            this.outputs.byteLength() +
            this.lockTime.byteLength();
    }

    write(writer) {
        this.version.write(writer);
        this.inputs.write(writer);
        this.outputs.write(writer);
        this.lockTime.write(writer);
    }

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
}

export class StandardTransaction extends Transaction {

    constructor(version, inputs, outputs, lockTime = 0) {
        super();
        this.version = new Uint32(version);
        this.inputs = inputs;
        this.outputs = outputs;
        this.lockTime = new Uint32(lockTime);
    }

    async id() {
        const txCopy = this.toBuffer()
        return SerialSHA256d.hash(txCopy)
    }

    static read(reader) {
        const version = reader.meta.version;
        const inputs = TxInputs.read(reader);
        const outputs = TxOutputs.read(reader);
        const lockTime = Uint32.read(reader);
        return new StandardTransaction(version, inputs, outputs, lockTime);
    }

}

export class SegWitTransaction extends Transaction {

    constructor(version, inputs, outputs, witnesses, lockTime) {
        super();
        this.version = new Uint32(version);
        this.marker = new Uint8(0);
        this.flag = new Uint8(1);
        this.inputs = inputs;
        this.outputs = outputs;
        this.witnesses = witnesses;
        this.lockTime = lockTime;
    }

    async id() {
        const txCopy = new Uint8Array(super.byteLength());
        this.write(new Writer(txCopy, 'TXID'));
        return SHA256d(txCopy)
    }

    write(writer) {
        switch (writer.mode) {
            case 'TXID':
                return super.write(writer);
            default:
                return this.writeAll(writer);
        }
    }

    writeAll(writer) {
        this.version.write(writer);
        this.marker.write(writer);
        this.flag.write(writer);
        this.inputs.write(writer);
        this.outputs.write(writer);
        this.witnesses.write(writer);
        this.lockTime.write(writer);
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
        const version = reader.meta.version;
        const flag = Uint8.read(reader);
        const inputs = TxInputs.read(reader);
        const outputs = TxOutputs.read(reader);
        const witnesses = Witnesses.read(reader);
        const lockTime = Uint32.read(reader)
        return new SegWitTransaction(version, inputs, outputs, witnesses, lockTime);
    }
}

class TxInputs {

    constructor(inputs) {
        this.inputs = inputs;
        this.inCount = new VarInt(inputs.length);
    }

    write(writer) {
        this.inCount.write(writer);
        this.inputs.forEach(input => input.write(writer));
    }

    byteLength() {
        return this.inCount.byteLength() +
            this.inputs.reduce((sum, input) => sum + input.byteLength(), 0);
    }

    static read(reader) {
        const inCount = reader.meta.inputsLength || VarInt.read(reader);
        reader.meta.inputsLength = inCount; // inCount is also witnessCount
        const inputs = [];
        for (let i = 0; i < inCount; i++) {
            const input = TxInput.read(reader);
            inputs.push(input);
        }
        return new TxInputs(inputs);
    }
}

class TxInput {

    constructor(prevTxOutHash, prevTxOutIndex, scriptSig, sequence = 0xffffffff) {
        if (!(prevTxOutHash instanceof SerialSHA256d)) {
            prevTxOutHash = SerialSHA256d.fromHex(prevTxOutHash);
        }
        this.prevTxOutHash = prevTxOutHash;
        this.prevTxOutIndex = new Uint32(prevTxOutIndex);

        if (!(scriptSig instanceof Script)) {
            scriptSig = Script.fromHex(scriptSig);
        }
        this.scriptSig = scriptSig;

        this.sequence = new Uint32(sequence); // irrelevant unless transaction's lock_time is > 0
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

    static read(reader) {
        const prevTxOutHash = SerialSHA256d.read(reader);
        const prevTxOutIndex = Uint32.read(reader);
        const scriptSig = Script.read(reader);
        const sequence = Uint32.read(reader);
        return new TxInput(prevTxOutHash, prevTxOutIndex, scriptSig, sequence)
    }
}

class TxOutputs {

    constructor(outputs) {
        this.outputs = outputs;
        this.outCount = new VarInt(outputs.length);
    }

    write(writer) {
        this.outCount.write(writer)
        this.outputs.forEach(output => output.write(writer));
    }

    byteLength() {
        return this.outCount.byteLength() + this.outputs.reduce(
            (sum, output) => sum + output.byteLength(), 0)
    }

    static read(reader) {
        const outCount = VarInt.read(reader);
        const outputs = [];
        for (let i = 0; i < outCount; i++) {
            const output = TxOutput.read(reader);
            outputs.push(output);
        }
        return new TxOutputs(outputs);
    }
}

class TxOutput {

    constructor(value, scriptPubKey) {
        if (!(value instanceof TxValue)) {
            value = new TxValue(value);
        }
        this.value = value;
        if (!(scriptPubKey instanceof Script)) {
            scriptPubKey = Script.fromHex(scriptPubKey);
        }
        this.scriptPubKey = scriptPubKey;
    }

    write(writer) {
        this.value.write(writer);
        this.scriptPubKey.write(writer);
    }

    byteLength() {
        return this.value.byteLength() + this.scriptPubKey.byteLength()
    }

    static read(reader) {
        const value = TxValue.read(reader)
        const scriptPubKey = Script.read(reader);
        return new TxOutput(value, scriptPubKey)
    }
    
}

class TxValue extends Uint64 {

    constructor(value) {
        super(value)
    }

    toBitcoins() {
        return Number(this.txValue.value) / 1e8;
    }

}

class Witnesses {

    constructor(witnesses) {
        this.witnesses = witnesses;
    }

    write(writer) {
        this.witnesses.forEach(
            witness => witness.write(writer))
    }

    byteLength() {
        return this.witnesses.reduce(
            (sum, witness) => sum + witness.byteLength(), 0)
    }

    static read(reader) {
        let witnesses = [];
        for (let i = 0; i < reader.meta.inputsLength; i++) {
            const witness = Witness.read(reader);
            witnesses.push(witness);
        }
        return new Witnesses(witnesses);
    }

}

class Witness {

    constructor(signatureScript, publicKeyScript, witnessCount) {
        this.witnessCount = witnessCount;
        this.signatureScript = signatureScript;
        this.publicKeyScript = publicKeyScript;
    }

    write(writer) {
        this.witnessCount.write(writer);
        this.signatureScript.write(writer);
        this.publicKeyScript.write(writer);
    }

    byteLength() {
        return this.witnessCount.byteLength() +
            this.signatureScript.byteLength() +
            this.publicKeyScript.byteLength();
    }

    static read(reader) {
        const witnessCount = VarInt.read(reader);
        const signatureScript = SignatureScript.read(reader);
        const publicKeyScript = PublicKeyScript.read(reader);
        return new Witness(witnessCount, signatureScript, publicKeyScript);
    }
}