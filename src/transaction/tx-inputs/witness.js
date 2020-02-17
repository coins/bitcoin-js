
// export class SignatureScript {

//     constructor(bitcoinSignature, scriptLength) {
//         this.bitcoinSignature = bitcoinSignature
//         this.scriptLength = scriptLength
//     }

//     write(writer) {
//         this.scriptLength.write(writer)
//         this.bitcoinSignature.write(writer)
//     }

//     byteLength() {
//         return this.bitcoinSignature.byteLength() + this.scriptLength.byteLength()
//     }

//     static read(reader) {
//         const scriptLength = Uint8.read(reader)
//         const bitcoinSignature = BitcoinSignature.read(reader)
//         return new SignatureScript(bitcoinSignature, scriptLength)
//     }
// }

// export class PublicKeyScript extends SerialBuffer {

//     constructor(buffer, length) {
//         super()
//         this.buffer = buffer
//         this.length = length
//     }

//     write(writer) {
//         this.length.write(writer)
//         writer.writeBytes(this._buffer)
//     }

//     byteLength() {
//         return this.length + this.length.byteLength()
//     }

//     static read(reader) {
//         const length = VarInt.read(reader)
//         const compressed = reader.readBytes(length)
//         return new PublicKeyScript(compressed, length)
//     }
// }

// class Witnesses {

//     constructor(witnesses) {
//         this.witnesses = witnesses;
//     }

//     write(writer) {
//         this.witnesses.forEach(
//             witness => witness.write(writer))
//     }

//     byteLength() {
//         return this.witnesses.reduce(
//             (sum, witness) => sum + witness.byteLength(), 0)
//     }

//     static read(reader) {
//         let witnesses = [];
//         for (let i = 0; i < reader.meta.inputsLength; i++) {
//             const witness = Witness.read(reader);
//             witnesses.push(witness);
//         }
//         return new Witnesses(witnesses);
//     }

// }

// class Witness {

//     constructor(signatureScript, publicKeyScript, witnessCount) {
//         this.witnessCount = witnessCount;
//         this.signatureScript = signatureScript;
//         this.publicKeyScript = publicKeyScript;
//     }

//     write(writer) {
//         this.witnessCount.write(writer);
//         this.signatureScript.write(writer);
//         this.publicKeyScript.write(writer);
//     }

//     byteLength() {
//         return this.witnessCount.byteLength() +
//             this.signatureScript.byteLength() +
//             this.publicKeyScript.byteLength();
//     }

//     static read(reader) {
//         const witnessCount = VarInt.read(reader);
//         const signatureScript = SignatureScript.read(reader);
//         const publicKeyScript = PublicKeyScript.read(reader);
//         return new Witness(witnessCount, signatureScript, publicKeyScript);
//     }
// }
