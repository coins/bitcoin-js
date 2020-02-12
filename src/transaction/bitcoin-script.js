import { SerialBuffer, Uint64, Uint32, VarInt, Uint8, SerialReader, SerialSHA256d } from '../../../buffer-js/src/serial-buffer/serial-buffer.js'
import { Buffer } from '../../../buffer-js/src/buffer.js'
import { byteToHex } from '../../../buffer-js/src/buffer-utils/buffer-utils.js'
import { opcodes } from './op-codes.js'

export class SignatureScript {

    constructor(rValue, sValue, sighashFlag, length) {
        this.rValue = rValue;
        this.sValue = sValue;
        this.sighashFlag = sighashFlag;
        this.length = length
    }

    write(writer) {
        this.length.write(writer);
        const tag = new Uint8(48); // tag
        tag.write(writer);

        const sequenceLength = new Uint8(this.rValue.byteLength + this.sValue.byteLength + 4);
        sequenceLength.write(writer);

        writer.writeByte(2); // integerElement1
        writer.writeByte(this.rValue.byteLength); // element1Length
        writer.writeBytes(this.rValue);

        writer.writeByte(2); // integerElement2
        writer.writeByte(this.sValue.byteLength); // element2Length
        writer.writeBytes(this.sValue);
        // this.sValue.write(writer); // rValue
        this.sighashFlag.write(writer);
    }

    byteLength() {
        return this.length + this.length.byteLength();
    }

    static read(reader) {
        // SignatureScripts use DER encoding 
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

        return new SignatureScript(rValue, sValue, sighashFlag, length);
    }
}

export class PublicKeyScript extends SerialBuffer {

    constructor(buffer, length) {
        super()
        this._buffer;
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
        return new PublicKeyScript(compressed, length)
    }
}

export class SighashFlag extends Uint8 {

    constructor(flag) {
        this.flagRaw = flag;
        this.flag = SighashFlag.toString(flag);
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

export class Script {

    constructor(script, asm, length) {
        this.script = script;
        this.asm = asm;
        this.length = length;
    }

    write(writer) {
        this.length.write(writer);
        // this.script.write(writer);
        writer.writeBytes(this.script)
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