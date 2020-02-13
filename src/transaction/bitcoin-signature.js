import { SerialBuffer, Uint8 } from '../../../buffer-js/src/buffer.js'
import { SignatureDER } from '../../../elliptic-js/src/signature-DER/signature-DER.js'

export class BitcoinSignature extends SerialBuffer {

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
        return this.signatureDER.byteLength() + sighashFlag.byteLength()
    }

    /**
     * @override
     */
    static read(reader) {
        const signatureDER = SignatureDER.read(reader)
        const sighashFlag = SigHashFlag.read(reader)
        return new SignatureDER(signatureDER, sighashFlag)
    }
}

export class SighashFlag extends Uint8 {

    static get FLAGS() {
        return {
            SIGHASH_ALL: 1,
            SIGHASH_NONE: 2,
            SIGHASH_SINGLE: 3,
            SIGHASH_ANYONECANPAY: 0x80,
        }
    }

    toString() {
        return SighashFlag.toString(this)
    }

    static toString(sighashFlag) {
        return Object.keys(SighashFlag.FLAGS).filter(key => SighashFlag.FLAGS[key] == sighashFlag)[0]
    }

}