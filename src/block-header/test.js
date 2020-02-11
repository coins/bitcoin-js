import { BlockHeader } from './block-header.js'

const rawHeader = '000000204832cf911681094faff756da06b3f4b109b7d967823314000000000000000000e46abce50d89c7108519e65f7e2455ac36b835c6c9014fe5a1269aca83b72c66936da75d5ca3151779263cc0'
const rawHeaderHash = '550ca73766e458b19b634b38c8c1054d8047aa04d5d10f000000000000000000'

describe('A BlockHeader', function() {

    it('can be deserialized and serialized into a hex string', function() {
        const header = BlockHeader.fromHex(rawHeader)
        expect(header.toHex()).toBe(rawHeader);
    })

    it('can compute a blockId', async function() {
        const header = BlockHeader.fromHex(rawHeader)
        const blockId = await header.blockId()
        expect(blockId.toHex()).toBe(rawHeaderHash);
    })

    it('can verify a proof of work', async function() {
        const header = BlockHeader.fromHex(rawHeader)
        const proof = await header.verifyProofOfWork()
        expect(proof).toBeTrue();
    })

})