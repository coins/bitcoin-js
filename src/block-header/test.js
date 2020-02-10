import { BlockHeader } from './block-header.js'

const rawHeader = '000000204832cf911681094faff756da06b3f4b109b7d967823314000000000000000000e46abce50d89c7108519e65f7e2455ac36b835c6c9014fe5a1269aca83b72c66936da75d5ca3151779263cc0'

describe('A block header', function() {

    it('can compute a Merkle root', async function() {
        const header = BlockHeader.fromHex(rawHeader)
        expect(header.toHex()).toBe(rawHeader);
    })

})