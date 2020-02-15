import { SerialBuffer, Uint8 } from '../../../../buffer-js/src/buffer.js'
import { SignatureDER } from '../../../../elliptic-js/src/signature-DER/signature-DER.js'

export class BitcoinSignature extends SerialBuffer {

    signatureDER = null

    sighashFlag = null

    constructor(signatureDER, sighashFlag) {
        super()
        this.signatureDER = signatureDER
        this.sighashFlag = new SighashFlag(sighashFlag)
    }

    /**
     * @override
     */
    write(writer) {
        this.signatureDER.write(writer)
        this.sighashFlag.write(writer)
    }

    /**
     * @override
     */
    byteLength() {
        return this.signatureDER.byteLength() + this.sighashFlag.byteLength()
    }

    /**
     * @override
     */
    static read(reader) {
        const signatureDER = SignatureDER.read(reader)
        const sighashFlag = SigHashFlag.read(reader)
        return new BitcoinSignature(signatureDER, sighashFlag)
    }
}

export class SighashFlag extends Uint8 {

    constructor(flag) {
        // if (!SighashFlag.isValidFlag(flag))
        //     throw Error(`${flag} is not a valid signature hash flag`)
        super(flag)
    }

    toString() {
        return SighashFlag.toString(this)
    }

    static get FLAGS() {
        return {
            SIGHASH_ALL: 1,
            SIGHASH_NONE: 2,
            SIGHASH_SINGLE: 3,
            SIGHASH_ANYONECANPAY: 128, // = 0x80
        }
    }

    static toString(sighashFlag) {
        return Object.keys(SighashFlag.FLAGS).filter(
            key => SighashFlag.FLAGS[key] == sighashFlag)[0]
    }

    static isValidFlag(flag) {
        return !!SighashFlag.FLAGS[flag]
    }


    static get SIGHASH_ALL() {
        return new SighashFlag(1)
    }

    static get SIGHASH_NONE() {
        return new SighashFlag(2)
    }

    static get SIGHASH_SINGLE() {
        return new SighashFlag(3)
    }

    static get SIGHASH_ANYONECANPAY() {
        return new SighashFlag(128)
    }

}