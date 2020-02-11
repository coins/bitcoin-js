import { Transaction } from './transaction.js'

const TX_HEX = '01000000017967a5185e907a25225574544c31f7b059c1a191d65b53dcc1554d339c4f9efc010000006a47304402206a2eb16b7b92051d0fa38c133e67684ed064effada1d7f925c842da401d4f22702201f196b10e6e4b4a9fff948e5c5d71ec5da53e90529c8dbd122bff2b1d21dc8a90121039b7bcd0824b9a9164f7ba098408e63e5b7e3cf90835cceb19868f54f8961a825ffffffff014baf2100000000001976a914db4d1141d0048b1ed15839d0b7a4c488cd368b0e88ac00000000';
const TXID = 'c1b4e695098210a31fe02abffe9005cffc051bbe86ff33e173155bcbdc5821e3'

/*
Correctly parsed `TX_HEX`:
	version:		01000000
	inputs count:		01
	input #1
		TXID:		7967a5185e907a25225574544c31f7b059c1a191d65b53dcc1554d339c4f9efc
		vout:		01000000
		scriptSigSize:	6a
		scriptSig:	47304402206a2eb16b7b92051d0fa38c133e67684ed064effada1d7f925c842da401d4f22702201f196b10e6e4b4a9fff948e5c5d71ec5da53e90529c8dbd122bff2b1d21dc8a90121039b7bcd0824b9a9164f7ba098408e63e5b7e3cf90835cceb19868f54f8961a825
		sequence:	ffffffff

	outputs count:		01
	output #1
		value:		4baf210000000000
		scriptPubKey:	1976a914db4d1141d0048b1ed15839d0b7a4c488cd368b0e88ac
	locktime:		00000000
*/

describe('A Transaction', function() {

    it('can be serialized and deserialized', async function() {
        const tx = Transaction.fromHex(TX_HEX)
        expect(tx.toHex()).toBe(TX_HEX)
    })

    it('can compute its TXID', async function() {
        const tx = Transaction.fromHex(TX_HEX)
        const txid = await tx.id()
        expect(txid.toHex()).toBe(TXID)
    })

    // it('can be created using inputs and outputs', async function() {
    //     const hexInput = '<input_here>'
    //     const hexOutput = '<output_here>'
    //     const expectedTXID = '<txid_here>'
    //     const input = Input.fromHex(hexInput)
    //     const output = Ouput.fromHex(hexOutput)
    //     const tx = new Transaction()
    //     tx.addInput(input)
    //     tx.addOutput(output)
    //     const txid = await tx.id()
    //     expect(txid.toHex()).toBe(expectedTXID)
    // })

})