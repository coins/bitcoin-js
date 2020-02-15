import { Transaction } from './transaction.js'
import * as Address from '../address/address.js'
/*
    @see https://github.com/bitcoin/bitcoin/blob/master/src/test/data/tx_valid.json
    @see https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/fixtures/transaction.json
    @see https://github.com/bitcoin/bitcoin/blob/master/src/test/data/sighash.json

 */

const TX_1_HEX = '01000000017967a5185e907a25225574544c31f7b059c1a191d65b53dcc1554d339c4f9efc010000006a47304402206a2eb16b7b92051d0fa38c133e67684ed064effada1d7f925c842da401d4f22702201f196b10e6e4b4a9fff948e5c5d71ec5da53e90529c8dbd122bff2b1d21dc8a90121039b7bcd0824b9a9164f7ba098408e63e5b7e3cf90835cceb19868f54f8961a825ffffffff014baf2100000000001976a914db4d1141d0048b1ed15839d0b7a4c488cd368b0e88ac00000000';
const TXID_1 = 'c1b4e695098210a31fe02abffe9005cffc051bbe86ff33e173155bcbdc5821e3'

const TX_2_HEX = '0100000001f1fefefefefefefefefefefefefefefefefefefefefefefefefefefefefefefe000000006b4830450221008732a460737d956fd94d49a31890b2908f7ed7025a9c1d0f25e43290f1841716022004fa7d608a291d44ebbbebbadaac18f943031e7de39ef3bf9920998c43e60c0401210279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ffffffff01a0860100000000001976a914c42e7ef92fdb603af844d064faad95db9bcdfd3d88ac00000000'
const TXID_2 = 'a0ff943d3f644d8832b1fa74be4d0ad2577615dc28a7ef74ff8c271b603a082a'


// @see https://medium.com/@bitaps.com/exploring-bitcoin-signature-hash-types-15427766f0a9
const TX_3_HEX = '0100000003ae8fe99eac2ced7681fdd2aedd25a83ff88fbed347571a2d7cb54aeb85a883f4010000006a473044022012048b6ac38277642e24e012267cf91c22326c3b447d6b4056698f7c298fb36202201139039bb4090a7cfb63c57ecc60d0ec8b7483bf0461a468743022759dc50124012102317ee6cd0c43381825bfe8bb0a51d46195dc36eca6adc7bb4bd2ead6a0909be0ffffffff5704be9a882060ac36f96e204553e92d37c78f831d84dce32832f4c0b919e594000000006a47304402207601fb44eab2eaf87b7988e672657c763d7ba0337cf19a3ba8fcdee55da483ec022067122f2e4aa523b1a081ad2b7a94a90cca16cd2a5214b31649a2e8aaf5565427012102dec5f30310c48e3ced04237a995469c41182383ee403d904ccb19ef85feaafa9ffffffff5704be9a882060ac36f96e204553e92d37c78f831d84dce32832f4c0b919e594010000006a473044022002f924830a1cf8214da7601e17a74d5e197c3f9b043d2964b4b4e99cfaf38f8402201587208194bc578e17d274ce5d7db253ce48d24ddd4f574377535d437351a74f0121032a934955fbdd4601265c801150f999ba6cda536de2dbfcab7d6912c803211b9bffffffff0563fb7805000000001976a914cd2be655e57086668a5be28c02f5563c06a1b47b88aca3738402000000001976a914ddcb7fedaacc18da645a2d7ffdabbc24880e288a88aca71b9a00000000001976a91486165b6dc00d1ae52685ed594f8262f39ec0150c88ac867f0d03000000001976a91421b95ee973b8966ff6cf039969491801cc42f1a088ace7489601000000001976a914c879015ab911026b277e48231a2bf256c6e9492688ac00000000'
const TX_3_INPUT_INDEX = 0
const TX_3_INPUT_0_SIGHASH_PREIMAGE = '0000000100000000ac882649e9c656f22b1a23487e276b0211b95a0179c814a9761900000000019648e7ac88a0f142cc011849699903cff66f96b873e95eb92114a9761900000000030d7f86ac880c15c09ef362824f59ed8526e51a0dc06d5b168614a9761900000000009a1ba7ac888a280e8824bcabfd7f2d5a64da18ccaaed7fcbdd14a9761900000000028473a3ac887bb4a1063c56f5028ce25b8a668670e555e62bcd14a97619000000000578fb6305ffffffff000000000194e519b9c0f43228e3dc841d838fc7372de95345206ef936ac6020889abe0457ffffffff000000000094e519b9c0f43228e3dc841d838fc7372de95345206ef936ac6020889abe0457ffffffffe09b90a0d6ead24bbbc7ada6ec36dc9561d4510abbe8bf251838430ccde67e31022100000001f483a885eb4ab57c2d1a5747d3be8ff83fa825ddaed2fd8176ed2cac9ee98fae0300000001'
const TX_3_INPUT_0_SIGHASH = 'd9c85312f47d05449c0f05fb09d726a309d75fd598ce927fbc565f0750412e14'

/*
Correctly parsed `TX_1_HEX`:
    version:            01000000
    inputs count:       01
    input #1
        TXID:           7967a5185e907a25225574544c31f7b059c1a191d65b53dcc1554d339c4f9efc
        vout:           01000000
        scriptSigSize:  6a
        scriptSig:      47304402206a2eb16b7b92051d0fa38c133e67684ed064effada1d7f925c842da401d4f22702201f196b10e6e4b4a9fff948e5c5d71ec5da53e90529c8dbd122bff2b1d21dc8a90121039b7bcd0824b9a9164f7ba098408e63e5b7e3cf90835cceb19868f54f8961a825
        sequence:       ffffffff

    outputs count:      01
    output #1
        value:          4baf210000000000
        scriptPubKey:   1976a914db4d1141d0048b1ed15839d0b7a4c488cd368b0e88ac
    locktime:           00000000
*/

describe('A Bitcoin Transaction', function() {

    it('can be serialized and deserialized', async function() {
        const tx = Transaction.fromHex(TX_1_HEX)
        expect(tx.toHex()).toBe(TX_1_HEX)
    })

    it('can compute its transaction id', async function() {
        const tx = Transaction.fromHex(TX_2_HEX)
        const txid = await tx.id()
        expect(txid.toHex()).toBe(TXID_2)
    })

    it('can copy itself', async function() {
        const tx = Transaction.fromHex(TX_3_HEX)
        const copy = tx.copy()
        expect(copy.toHex()).toBe(TX_3_HEX)
    })

    it('can calculate its signature hashes', async function() {
        const tx = Transaction.fromHex(TX_3_HEX)
        const publicKeyHex = '02317ee6cd0c43381825bfe8bb0a51d46195dc36eca6adc7bb4bd2ead6a0909be0'
        const pubKeyScript = await Address.fromPublicKeyHex(publicKeyHex)
        const sigHashFlag = 1
        // const signatureHash = await tx.hash(TX_3_INPUT_INDEX, sigHashFlag, pubKeyScript)
        // const tx_hex = tx.toHex()
        // console.log(tx_hex)
        // expect(tx_hex).toBe(TX_3_INPUT_0_SIGHASH_PREIMAGE)
        // expect(signatureHash.toHex()).toBe(TX_3_INPUT_0_SIGHASH)
    })



    xit('can verify its scripts', async function() {
        const tx_hex = ''
        const expected_txid = 'a0ff943d3f644d8832b1fa74be4d0ad2577615dc28a7ef74ff8c271b603a082a'
        const tx = Transaction.fromHex(TX_1_HEX)
        const txid = await tx.id()
        expect(txid.toHex()).toBe(expected_txid)
    })

    xit('can be created using inputs and outputs', async function() {
        const hexInput = '<input_here>'
        const hexOutput = '<output_here>'
        const expectedTXID = '<txid_here>'
        const input = Input.fromHex(hexInput)
        const output = Ouput.fromHex(hexOutput)
        const tx = new Transaction()
        tx.addInput(input)
        tx.addOutput(output)
        const txid = await tx.id()
        expect(txid.toHex()).toBe(expectedTXID)
    })


})