import { Uint32, HexReader, SerialBuffer, SerialSHA256d } from '../../../buffer-js/src/serial-buffer/serial-buffer.js'

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

    async verifyPredecessor(prevHeader, medianTime) {
        if (!this.timeStamp.verifyPredecessor(prevHeader.timeStamp, medianTime))
            return false;
        return this.verifyPredecessorId(prevHeader)
    }

    async verifyPredecessorId(prevHeader) {
        const prevId = await prevHeader.blockId()
        return this.prevBlockId.equals(prevId)
    }

    async verifyProofOfWork() {
        const hash = (await this.blockId()).reverse().toBigInt() // reverse to fix Satoshi's byte order
        return hash < this.bits.difficulty
    }
}

class TimeStamp extends Uint32 {

    constructor(value) {
        super(value);
        this.formatted = new Date(value * 1000);
    }

    /**
     * A time stamp is accepted as valid 
     * if it is greater than the median time stamp of previous 11 blocks.
     */
    verifyPredecessor(timeStamp, medianTime) {
        // TODO: verify the time stamp 
        // (see: https://en.bitcoin.it/wiki/Block_timestamp)
        return true
    }
}

class Bits extends Uint32 {

    constructor(bits) {
        super(bits)
    }

    get difficulty() {
        return BigInt(this) * 2n ** (8n * (27n - 3n))
    }
}