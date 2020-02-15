
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
