class Transaction {

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
        const version = Uint32.read(reader);
        const marker = VarInt.read(reader);

        reader.meta.version = version;
        reader.meta.isSegWit = (marker == 0);

        if (reader.meta.isSegWit) {
            return SegWitTransaction.read(reader);
        } else {
            reader.meta.inputsLength = marker;
            return StandardTransaction.read(reader);
        }
    }

    toHex() {
        const writer = new HexWriter();
        this.write(writer);
        return writer.result();
    }

    static fromHex(rawTxHex) {
        const tx = Transaction.read(new HexReader(rawTxHex));
        return tx;
    }

    toBuffer() {
        const buffer = new Uint8Array(this.byteLength());
        const writer = new Writer(buffer);
        this.write(writer);
        return writer.result();
    }

}

class StandardTransaction extends Transaction {

    constructor(version, inputs, outputs, lockTime = 0) {
        super();
        this.version = new Uint32(version);
        this.inputs = inputs;
        this.outputs = outputs;
        this.lockTime = new Uint32(lockTime);
    }

    async txid() {
        const txCopy = this.toBuffer();
        const hash = await dSHA256(txCopy);
        return new Hash(hash);
    }

    static read(reader) {
        const version = reader.meta.version;
        const inputs = TxInputs.read(reader);
        const outputs = TxOutputs.read(reader);
        const lockTime = Uint32.read(reader);
        return new StandardTransaction(version, inputs, outputs, lockTime);
    }

}


class SegWitTransaction extends Transaction {

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

    async txid() {
        const txCopy = new Uint8Array(super.byteLength());
        this.write(new Writer(txCopy, 'TXID'));
        const hash = await dSHA256(txCopy);
        return new Hash(hash);
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
        if (!(prevTxOutHash instanceof Hash)) {
            prevTxOutHash = Hash.fromHex(prevTxOutHash);
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
        const prevTxOutHash = Hash.read(reader);
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
        return this.outCount.byteLength() + this.outputs.reduce((sum, output) => sum + output.byteLength(), 0);
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

class TxValue {

    constructor(value) {
        this.txValue = new Uint64(value);
    }

    toBitcoins() {
        return Number(this.txValue.value) / 1e8;
    }

    write(writer) {
        this.txValue.write(writer);
    }

    byteLength() {
        return this.txValue.byteLength();
    }

    static read(reader) {
        const value = Uint64.read(reader);
        return new TxValue(value);
    }
}

class Witnesses {

    constructor(witnesses) {
        this.witnesses = witnesses;
    }

    write(writer) {
        this.witnesses.forEach(witness => witness.write(writer));
    }

    byteLength() {
        return this.witnesses.reduce((sum, witness) => sum + witness.byteLength(), 0);
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

    constructor(signature, publicKey, witnessCount) {
        this.witnessCount = witnessCount;
        this.signature = signature;
        this.publicKey = publicKey;
    }

    write(writer) {
        this.witnessCount.write(writer);
        this.signature.write(writer);
        this.publicKey.write(writer);
    }

    byteLength() {
        return this.witnessCount.byteLength() +
            this.signature.byteLength() +
            this.publicKey.byteLength();
    }

    static read(reader) {
        const witnessCount = VarInt.read(reader);
        const signature = Signature.read(reader);
        const publicKey = PublicKey.read(reader);
        return new Witness(witnessCount, signature, publicKey);
    }
}

class Signature {

    constructor(rValue, sValue, sighashFlag, length) {
        this.rValue = new Buffer(rValue);
        this.sValue = new Buffer(sValue);
        this.sighashFlag = sighashFlag;
        this.length = length
    }

    write(writer) {
        this.length.write(writer);
        const tag = new Uint8(48); // tag
        tag.write(writer);

        const sequenceLength = new Uint8(this.rValue.byteLength() + this.sValue.byteLength() + 4);
        sequenceLength.write(writer);

        writer.writeByte(2); // integerElement1
        writer.writeByte(this.rValue.byteLength()); // element1Length
        this.rValue.write(writer);

        writer.writeByte(2); // integerElement2
        writer.writeByte(this.sValue.byteLength()); // element2Length
        this.sValue.write(writer); // rValue
        this.sighashFlag.write(writer);
    }

    byteLength() {
        return this.length + this.length.byteLength();
    }

    static read(reader) {
        // Signatures use DER encoding 
        const length = Uint8.read(reader);
        const tag = Uint8.read(reader);
        const sequenceLength = Uint8.read(reader);
        const integerElement1 = Uint8.read(reader);
        const elementLength1 = Uint8.read(reader);
        const rValue = reader.readBytes(elementLength1);

        const integerElement2 = Uint8.read(reader);
        const elementLength2 = Uint8.read(reader);
        const sValue = reader.readBytes(elementLength2);
        const sighashFlag = SighashFlag.read(reader);

        return new Signature(rValue, sValue, sighashFlag, length);
    }
}

class PublicKey extends Buffer {

    constructor(buffer, length) {
        super(buffer);
        this.length = length;
    }

    write(writer) {
        this.length.write(writer);
        writer.writeBytes(this._buffer);
    }

    byteLength() {
        return this.length + this.length.byteLength();
    }

    static read(reader) {
        const length = VarInt.read(reader);
        const compressed = reader.readBytes(length);
        return new PublicKey(compressed, length)
    }
}

class SighashFlag {

    constructor(flag) {
        this.flagRaw = flag;
        this.flag = SighashFlag.toString(flag);
    }

    write(writer) {
        this.flagRaw.write(writer);
    }

    static read(reader) {
        const flag = Uint8.read(reader)
        return new SighashFlag(flag)
    }

    static get FLAGS() {
        return {
            SIGHASH_ALL: 1,
            SIGHASH_NONE: 2,
            SIGHASH_SINGLE: 3,
            SIGHASH_ANYONECANPAY: 0x80,
        }
    }

    static toString(sighashFlag) {
        return Object.keys(SighashFlag.FLAGS).filter(key => SighashFlag.FLAGS[key] == sighashFlag)[0]
    }

}

class Script {

    constructor(script, asm, length) {
        this.script = new Buffer(script);
        this.asm = asm;
        this.length = length;
    }

    write(writer) {
        this.length.write(writer);
        this.script.write(writer);
    }

    byteLength() {
        return this.length.byteLength() + this.length;
    }

    static read(reader) {
        const length = VarInt.read(reader);
        const script = reader.readBytes(length);
        const scriptReader = new Reader(script);
        const asm = [];

        while (!scriptReader.isEmpty()) {
            const opcode = OpCode.read(scriptReader);
            asm.push(opcode)
        }

        return new Script(script, asm, length);
    }

    static fromHex(hex) {
        const scriptLength = new VarInt( hex.length / 2 ).toHex(); // FIXME should be VarInt not Uint8
        hex = scriptLength + hex;
        return Script.read(new HexReader(hex));
    }

    static fromAsm(asm){
        const tokens = asm.split(' ');
        const script = tokens.map( token => {
            const opcode = opcodes[token];
            if(opcode){
                return byteToHex(opcode)
            } else {
                return token
            }
        }).join('');
        return 
    }

   toBuffer() {
        const buffer = new Uint8Array(this.byteLength());
        const writer = new Writer(buffer);
        this.write(writer);
        return writer.result();
    }

    async toScriptHash(){
        const hash = await HASH160( this.toBuffer() ) ;
        const OP_HASH160 = 'a9'; 
        const OP_PUSH20 = '14'; 
        const OP_EQUAL = '87'; 
        return `${OP_HASH160}${OP_PUSH20}${hash._hex}${OP_EQUAL}`;
    }
}

class OpCode {

    static read(reader) {
        const opcode = Uint8.read(reader);

        if (OpCode.isPushData(opcode)) {
            if (opcode > reader.bytesLeft)
                return `OP_PUSH(${opcode}) <push past end>`;
            const data = new Buffer(reader.readBytes(opcode));
            return `OP_PUSH(${opcode}) ${data.toHex()}`;
        }

        if (opcode == 76) { // OP_PUSHDATA1
            const length = Uint8.read(reader);
            const data = new Buffer(reader.readBytes(length));
            return data;
        }

        if (opcode == 77) { // OP_PUSHDATA2
            const length = Uint16.read(reader);
            const data = new Buffer(reader.readBytes(length));
            return data;
        }

        if (opcode == 78) { // OP_PUSHDATA4
            const length = Uint32.read(reader);
            const data = new Buffer(reader.readBytes(length));
            return data;
        }

        if (OpCode.isOpCode(opcode)) {
            return OpCode.toString(opcode);
        }
    }

    static isOpCode(opcode) {
        return opcode === 0 || !!Object.keys(opcodes).filter(key => opcodes[key] == opcode)[0];
    }

    static isPushData(opcode) {
        return opcode > 0 && opcode < 76;
    }

    static toString(opcode) {
        return Object.keys(opcodes).filter(key => opcodes[key] == opcode)[0];
    }

}