import { Uint32, HexReader, SerialBuffer } from '../../../buffer-js/src/serial-buffer/serial-buffer.js'
import { SerialSHA256d } from '../../../hash-js/hash.js'

/**
 * A Bitcoin block header
 */
export class BlockHeader extends SerialBuffer {

    /**
     * Create a BlockHeader
     * @param  {Uint32}            version - This block's version.
     * @param  {SerialSHA256d}     prevBlockId - The previous block's hash.
     * @param  {SerialSHA256d}     merkleRoot - This block's transactions' Merkle root.
     * @param  {TimeStamp}         timeStamp - This block's creation date. 
     * @param  {DifficultyBits}    bits - The target difficulty for the proof-of-work.
     * @param  {Uint32}            nonce - The nonce to solve the proof-of-work puzzle.
     *
     * @see https://en.bitcoin.it/wiki/Block_hashing_algorithm
     */
    constructor(version, prevBlockId, merkleRoot, timeStamp, bits, nonce) {
        super()
        this.version = version // TODO: this should be a signed int.
        this.prevBlockId = prevBlockId
        this.merkleRoot = merkleRoot
        this.timeStamp = timeStamp
        this.bits = bits
        this.nonce = nonce
    }

    /**
     * @override
     */
    write(writer) {
        this.version.write(writer)
        this.prevBlockId.write(writer)
        this.merkleRoot.write(writer)
        this.timeStamp.write(writer)
        this.bits.write(writer)
        this.nonce.write(writer)
    }

    /**
     * @override
     */
    static read(reader) {
        const version = Uint32.read(reader)
        const prevBlockId = SerialSHA256d.read(reader)
        const merkleRoot = SerialSHA256d.read(reader)
        const timeStamp = TimeStamp.read(reader)
        const bits = DifficultyBits.read(reader)
        const nonce = Uint32.read(reader)
        return new BlockHeader(version, prevBlockId, merkleRoot, timeStamp, bits, nonce)
    }

    /**
     * @override
     */
    byteLength() {
        return this.version.byteLength() +
            this.prevBlockId.byteLength() +
            this.merkleRoot.byteLength() +
            this.timeStamp.byteLength() +
            this.bits.byteLength() +
            this.nonce.byteLength()
    }

    /**
     * The header's id is its double-SHA256 hash.
     * @return {Promise<SerialSHA256d>}
     */
    id() {
        const txCopy = this.toBuffer();
        return SerialSHA256d.hash(txCopy)
    }

    /**
     * Verifies the header succeeds its predecessor, 
     * and verifies the correctness of its time stamp.
     * @param {BlockHeader} prevHeader - The previous header.
     * @param {number} currMedianTime - The median time stamp of previous 11 blocks.
     * @return {Promise<boolean>} - The verification result.
     */
    async verifyPredecessor(prevHeader, currMedianTime) {
        if (!this.timeStamp.verifyPredecessor(currMedianTime))
            return false;
        return this.verifyPredecessorId(prevHeader)
    }

    /**
     * Verifies the header succeeds its predecessor.
     * @param {BlockHeader} prevHeader - The previous header.
     * @return {Promise<Boolean>} - The verification result.
     */
    async verifyPredecessorId(prevHeader) {
        const prevId = await prevHeader.id()
        return this.prevBlockId.equals(prevId)
    }

    /**
     * Verifies the header's proof of work
     * @return {Promise<Boolean>} - The verification result.
     */
    async verifyProofOfWork() {
        const hash = (await this.id()).reverse().toBigInt() // reverse to fix Satoshi's byte order
        return hash < this.bits.difficulty
    }
}


/**
 * The time stamp of a block header.
 * @see https://en.bitcoin.it/wiki/Block_timestamp
 */
class TimeStamp extends Uint32 {

    /**
     * Format as native Date object.
     * @return {Date} - The corresponding Date. 
     */
    get formatted() {
        return new Date(this * 1000)
    }

    /**
     * A time stamp is accepted as valid 
     * if it is greater than the median time stamp of previous 11 blocks.
     * @param  {Number} currMedianTime - The median time stamp of previous 11 blocks.
     * @return {Boolean} - the verification result.
     */
    verifyPredecessor(currMedianTime) {
        return this > currMedianTime
    }
}

/**
 * The difficulty target for a proof of work.
 * @see https://en.bitcoin.it/wiki/Difficulty
 */
class DifficultyBits extends Uint32 {

    /**
     * @return {BigInt} - The difficulty
     */
    get difficulty() {
        return BigInt(this) * 2n ** (8n * (27n - 3n))
    }
}