import { BlockHeader } from './block-header.js'

const TEST_HEADER_1_HEX = '0100000050120119172a610421a6c3011dd330d9df07b63616c2cc1f1cd00200000000006657a9252aacd5c0b2940996ecff952228c3067cc38d4885efb5a4ac4247e9f337221b4d4c86041b0f2b5710'
const TEST_HEADER_1_HASH_HEX = '000000000003ba27aa200b1cecaad478d2b00432346c3f1f3986da1afd33e506'
const TEST_HEADER_2_HEX = '0100000006e533fd1ada86391f3f6c343204b0d278d4aaec1c0b20aa27ba0300000000006abbb3eb3d733a9fe18967fd7d4c117e4ccbbac5bec4d910d900b3ae0793e77f54241b4d4c86041b4089cc9b'
const TEST_HEADER_2_HASH_HEX = '00000000000080b66c911bd5ba14a74260057311eaeb1982802f7010f1a9f090'

describe('A BlockHeader', function() {

    it('can be serialized and deserialized', function() {
        const header = BlockHeader.fromHex(TEST_HEADER_1_HEX)
        expect(header.toHex()).toBe(TEST_HEADER_1_HEX);
    })

    it('can compute a blockId', async function() {
        const header = BlockHeader.fromHex(TEST_HEADER_1_HEX)
        const blockId = await header.blockId()
        expect(blockId.toHex()).toBe(TEST_HEADER_1_HASH_HEX);
    })

    it('can verify a proof of work', async function() {
        const header = BlockHeader.fromHex(TEST_HEADER_1_HEX)
        const proof = await header.verifyProofOfWork()
        expect(proof).toBeTrue();
    })

    it('can verify its predecessor', async function() {
        const header_1 = BlockHeader.fromHex(TEST_HEADER_1_HEX)
        const header_2 = BlockHeader.fromHex(TEST_HEADER_2_HEX)
        const proof = await header_2.verifyPredecessor(header_1)
        expect(proof).toBeTrue();
    })

})