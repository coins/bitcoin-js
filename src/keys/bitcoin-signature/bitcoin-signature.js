import { SerialBuffer, Uint8 } from '../../../../buffer-js/src/buffer.js'
import { SignatureDER } from '../../../../elliptic-js/src/signature-DER/signature-DER.js'

export class BitcoinSignature extends SerialBuffer {

    /** 
     * The DER encoded ECDSA signature.
     * @type {SignatureDER}
     */
    //signatureDER

    /**
     * The signature's hash flag.
     * @type {SighashFlag}
     */
    //sighashFlag

    /**
     * @param  {SignatureDER} signatureDER - The DER encoded ECDSA signature.
     * @param  {SighashFlag} sighashFlag - The signature's hash flag.
     */
    constructor(signatureDER, sighashFlag) {
        super()
        this.signatureDER = signatureDER
        this.sighashFlag = sighashFlag
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

/**
 * A Signature's hash type.
 */
export class SighashFlag extends Uint8 {

    constructor(flag) {
        // if (!SighashFlag.isValidFlag(flag))
        //     throw Error(`${flag} is not a valid signature hash flag`)
        super(flag)
    }

    static get FLAGS() {
        return {
            SIGHASH_ALL: 0x01,
            SIGHASH_NONE: 0x02,
            SIGHASH_SINGLE: 0x03,
            SIGHASH_ANYONECANPAY: 0x80
        }
    }

    static isValidFlag(flag) {
        return !!SighashFlag.FLAGS[flag]
    }

    static get SIGHASH_ALL() {
        return new SighashFlag(0x01)
    }

    static get SIGHASH_NONE() {
        return new SighashFlag(0x02)
    }

    static get SIGHASH_SINGLE() {
        return new SighashFlag(0x03)
    }

    static get SIGHASH_ANYONECANPAY() {
        return new SighashFlag(0x80)
    }


    // WARNING!
    // The following implicitly overwrites Number.toString(16) and thus, hex conversion!
    //
    // toString() {
    //     return SighashFlag.toString(this)
    // }

    // static toString(sighashFlag) {
    //     return Object.keys(SighashFlag.FLAGS).filter(
    //         key => SighashFlag.FLAGS[key] == sighashFlag)[0]
    // }

}