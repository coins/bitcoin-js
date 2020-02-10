import { Uint32, HexReader } from '../../../buffer-js/src/serial-buffer.js'
import { dSHA256 } from '../../../hash-js/hash.js'

export class BlockHeader {

    constructor(version, hashPrevBlock, hashMerkleRoot, timeStamp, bits, nonce) {
        this.version = version;
        this.hashPrevBlock = hashPrevBlock;
        this.hashMerkleRoot = hashMerkleRoot;
        this.timeStamp = timeStamp;
        this.bits = bits;
        this.nonce = nonce;
    }

    write(writer) {
        this.version.write(writer);
        this.hashPrevBlock.write(writer);
        this.hashMerkleRoot.write(writer);
        this.timeStamp.write(writer);
        this.bits.write(writer);
        this.nonce.write(writer);
    }

    static read(reader) {
        const version = Uint32.read(reader);
        const hashPrevBlock = Hash.read(reader);
        const hashMerkleRoot = Hash.read(reader);
        const timeStamp = TimeStamp.read(reader);
        const bits = Bits.read(reader);
        const nonce = Uint32.read(reader);
        return new BlockHeader(version, hashPrevBlock, hashMerkleRoot, timeStamp, bits, nonce);
    }

    byteLength() {
        return this.version.byteLength() +
            this.hashPrevBlock.byteLength() +
            this.hashMerkleRoot.byteLength() +
            this.timeStamp.byteLength() +
            this.bits.byteLength() +
            this.nonce.byteLength();
    }

    toBuffer() {
        const buffer = new Uint8Array(this.byteLength());
        const writer = new Writer(buffer);
        this.write(writer);
        return writer.result();
    }

    async blockId() {
        const txCopy = this.toBuffer();
        const hash = await dSHA256(txCopy);
        return new Hash(hash);
    }

    async verifyPrev(prevHeader) {
        const prevId = await prevHeader.blockId();
        return Buffer.equals(this.hashPrevBlock, prevId);
    }

    async verifyProofOfWork() {
        const proof = (await this.blockId()).toBigInt();
        return this.bits.difficulty > proof;
    }

    static fromHex(hexString){
    	return BlockHeader.read(new HexReader(hexString))
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