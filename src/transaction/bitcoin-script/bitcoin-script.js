import { Buffer, byteToHex, SerialBuffer, Uint32, VarInt, Uint8, SerialReader, HexReader, concat } from '../../../../buffer-js/src/buffer.js'
import { opcodes } from './op-codes.js'
import { SerialSHA256d, HASH160 } from '../../../../hash-js/hash.js'
import { scriptToP2SH } from '../../keys/address/address.js'


export class Script extends SerialBuffer {

    constructor(script, asm) {
        super()
        this.script = script
        this.asm = asm
    }

    write(writer) {
        this.scriptLength.write(writer)
        writer.writeBytes(this.script)
    }

    add(script) {
        const length = script.byteLength || script.size()

        // We have to do a minimal push!
        // https://github.com/lbryio/lbrycrd/issues/242#issuecomment-455920837
        // https://github.com/lbryio/lbrycrd/blob/master/src/script/interpreter.cpp#L229
        if (length < 76) {
            this.script = concat(this.script, Buffer.fromBigInt(BigInt(length)))
        } else {
            this.script = concat(this.script, Buffer.fromBigInt(BigInt(0x4c)))
            this.script = concat(this.script, Buffer.fromBigInt(BigInt(length)))
            // TODO: implement the other OP_PUSHDATA opcodes
        }

        this.script = concat(this.script, script)
    }

    /**
     * The number of bytes as VarInt.
     * @return {VarInt}
     */
    get scriptLength() {
        return new VarInt(this.script.byteLength)
    }

    byteLength() {
        return this.scriptLength.byteLength() + this.scriptLength
    }

    static read(reader) {
        const length = VarInt.read(reader)
        const script = reader.readBytes(length)
        const scriptReader = new SerialReader(script)
        const asm = []

        while (!scriptReader.isEmpty()) {
            const opcode = OpCode.read(scriptReader)
            asm.push(opcode)
        }

        return new Script(script, asm)
    }

    static fromHex(hex) {
        const scriptLength = new VarInt(hex.length / 2).toHex()
        hex = scriptLength + hex
        return Script.read(new HexReader(hex))
    }

    static fromAsm(asm) {
        const tokens = asm.split(' ')
        const script = tokens.map(token => {
            const opcode = opcodes[token]
            if (opcode) {
                return byteToHex(opcode)
            } else {
                return token
            }
        }).join('')
        return Script.fromHex(script)
    }

    async toScriptHash() {
        const hash = await HASH160.hash(this.toBuffer())
        const hashHex = hash.toHex()
        const OP_HASH160 = 'a9'
        const OP_PUSH20 = '14'
        const OP_EQUAL = '87'
        return `${OP_HASH160}${OP_PUSH20}${hashHex}${OP_EQUAL}`
    }

    async toAddress(network) {
        return scriptToP2SH(this.toBuffer(), network)
    }
}

export class OpCode {

    static read(reader) {
        const opcode = Uint8.read(reader);

        if (OpCode.isPushData(opcode)) {
            if (opcode > reader.bytesLeft)
                return `OP_PUSH(${opcode}) <push past end>`
            const data = new Buffer(reader.readBytes(opcode))
            return `OP_PUSH(${opcode}) ${data.toHex()}`
        }

        if (opcode == 76) { // OP_PUSHDATA1
            const length = Uint8.read(reader)
            const data = new Buffer(reader.readBytes(length))
            return data
        }

        if (opcode == 77) { // OP_PUSHDATA2
            const length = Uint16.read(reader)
            const data = new Buffer(reader.readBytes(length))
            return data
        }

        if (opcode == 78) { // OP_PUSHDATA4
            const length = Uint32.read(reader)
            const data = new Buffer(reader.readBytes(length))
            return data
        }

        if (OpCode.isOpCode(opcode)) {
            return OpCode.toString(opcode)
        }
    }

    static isOpCode(opcode) {
        return opcode === 0 || !!Object.keys(opcodes).filter(key => opcodes[key] == opcode)[0]
    }

    static isPushData(opcode) {
        return opcode > 0 && opcode < 76
    }

    static toString(opcode) {
        return Object.keys(opcodes).filter(key => opcodes[key] == opcode)[0]
    }
}