import { Buffer, byteToHex, SerialBuffer, Uint64, Uint32, VarInt, Uint8, SerialReader, HexReader, concat } from '../../../buffer-js/src/buffer.js'
import { opcodes } from './op-codes.js'
import { BitcoinSignature } from '../private-key/bitcoin-signature.js'
import { SerialSHA256d } from '../../../hash-js/hash.js'


export class SignatureScript {

    constructor(bitcoinSignature, scriptLength) {
        this.bitcoinSignature = bitcoinSignature
        this.scriptLength = scriptLength
    }

    write(writer) {
        this.scriptLength.write(writer)
        this.bitcoinSignature.write(writer)
    }

    byteLength() {
        return this.bitcoinSignature.byteLength() + this.scriptLength.byteLength()
    }

    static read(reader) {
        const scriptLength = Uint8.read(reader)
        const bitcoinSignature = BitcoinSignature.read(reader)
        return new SignatureScript(bitcoinSignature, scriptLength)
    }
}

export class PublicKeyScript extends SerialBuffer {

    constructor(buffer, length) {
        super()
        this.buffer = buffer
        this.length = length
    }

    write(writer) {
        this.length.write(writer)
        writer.writeBytes(this._buffer)
    }

    byteLength() {
        return this.length + this.length.byteLength()
    }

    static read(reader) {
        const length = VarInt.read(reader)
        const compressed = reader.readBytes(length)
        return new PublicKeyScript(compressed, length)
    }
}

export class Script {

    constructor(script, asm, length) {
        this.script = script
        this.asm = asm
        this.length = length
    }

    write(writer) {
        this.length = new VarInt(this.script.byteLength)
        this.length.write(writer)
        // this.script.write(writer);
        writer.writeBytes(this.script)
    }

    add(script) {
        const length = script.byteLength || script.size()
        this.script = concat(this.script, Buffer.fromBigInt(BigInt(76)))
        this.script = concat(this.script, Buffer.fromBigInt(BigInt(length)))
        this.script = concat(this.script, script)
    }

    byteLength() {
        return this.length.byteLength() + this.length;
    }

    static read(reader) {
        const length = VarInt.read(reader);
        const script = reader.readBytes(length);
        const scriptReader = new SerialReader(script);
        const asm = [];

        while (!scriptReader.isEmpty()) {
            const opcode = OpCode.read(scriptReader);
            asm.push(opcode)
        }

        return new Script(script, asm, length);
    }

    static fromHex(hex) {
        const scriptLength = new VarInt(hex.length / 2).toHex(); // FIXME should be VarInt not Uint8
        hex = scriptLength + hex;
        return Script.read(new HexReader(hex));
    }

    static fromAsm(asm) {
        const tokens = asm.split(' ');
        const script = tokens.map(token => {
            const opcode = opcodes[token];
            if (opcode) {
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

    async toScriptHash() {
        const hash = await HASH160(this.toBuffer());
        const OP_HASH160 = 'a9';
        const OP_PUSH20 = '14';
        const OP_EQUAL = '87';
        return `${OP_HASH160}${OP_PUSH20}${hash._hex}${OP_EQUAL}`;
    }
}

export class OpCode {

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