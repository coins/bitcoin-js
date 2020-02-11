import { Uint32, HexReader, SerialBuffer, SerialSHA256d  } from '../../../buffer-js/src/serial-buffer/serial-buffer.js'

export class BlockHeader extends SerialBuffer {

    constructor(version, prevBlockId, merkleRoot, timeStamp, bits, nonce) {
        super()
        this.version = version;
        this.prevBlockId = prevBlockId;
        this.merkleRoot = merkleRoot;
        this.timeStamp = timeStamp;
        this.bits = bits;
        this.nonce = nonce;
    }

    write(writer) {
        this.version.write(writer);
        this.prevBlockId.write(writer);
        this.merkleRoot.write(writer);
        this.timeStamp.write(writer);
        this.bits.write(writer);
        this.nonce.write(writer);
    }

    static read(reader) {
        const version = Uint32.read(reader);
        const prevBlockId = SerialSHA256d.read(reader);
        const merkleRoot = SerialSHA256d.read(reader);
        const timeStamp = TimeStamp.read(reader);
        const bits = Bits.read(reader);
        const nonce = Uint32.read(reader);
        return new BlockHeader(version, prevBlockId, merkleRoot, timeStamp, bits, nonce);
    }

    byteLength() {
        return this.version.byteLength() +
            this.prevBlockId.byteLength() +
            this.merkleRoot.byteLength() +
            this.timeStamp.byteLength() +
            this.bits.byteLength() +
            this.nonce.byteLength();
    }

    blockId() {
        const txCopy = this.toBuffer();
        return SerialSHA256d.hash(txCopy);
    }

    async verifyPredecessor(prevHeader) {
        // TODO: verify the time stamp
        const prevId = await prevHeader.blockId()
        return this.prevBlockId.equals(prevId)
    }

    async verifyProofOfWork() {
        const proof = (await this.blockId()).reverse().toBigInt()  // reverse to fix Satoshi's byte order
        return this.bits.difficulty > proof
    }
}

class TimeStamp extends Uint32 {

    constructor(value) {
        super(value);
        this.formatted = new Date(value * 1000);
    }

}

class Bits extends Uint32 {

    constructor(bits) {
        super(bits);
        this.difficulty = BigInt(bits) * 2n ** (8n * (27n - 3n));
    }

}