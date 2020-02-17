import * as Wallet from './wallet.js'
import { TestnetPrivateKey } from '../private-key/private-key.js'
import * as Address from '../address/address.js'
import { StandardTransaction } from '../../transaction/transaction.js'
import { Script } from '../../transaction/bitcoin-script/bitcoin-script.js'
import { SHA256d } from '../../../../hash-js/hash.js'



describe('A wallet', function() {

    it('can build a transaction', async function() {
        // const signedTx = await Wallet.pay()
        // console.log(signedTx)
    })

})

describe('Transaction builder', function() {
    
    // @see https://medium.com/@bitaps.com/exploring-bitcoin-signing-the-p2pkh-input-b8b4d5c4809c

    it('can build a transaction', async function() {
        const privateKey = await TestnetPrivateKey.import('92yMVPtwzsMDDHXhCxf6qexLXQwdHE7wwREc24E59nyzjAWXVAf')
        const address = await privateKey.toAddress()
        expect(address).toBe('mvJe9AfPLrxpfHwjLNjDAiVsFSzwBGaMSP')

        const tx = new StandardTransaction()

        tx.inputs.add('5e2383defe7efcbdc9fdd6dba55da148b206617bbb49e6bb93fce7bfbb459d44', 1)

        tx.outputs.add(129000000n, 'n4AYuETorj4gYKendz2ndm9QhjUuruZnfk')

        expect(tx.toHex()).toBe('0100000001449d45bbbfe7fc93bbe649bb7b6106b248a15da5dbd6fdc9bdfc7efede83235e0100000000ffffffff014062b007000000001976a914f86f0bc0a2232970ccdf4569815db500f126836188ac00000000')

        const scriptPubKey = Address.addressToScriptPubKey(address)
        expect(scriptPubKey).toBe('76a914a235bdde3bb2c326f291d9c281fdc3fe1e956fe088ac')

        const hashSigPreimage = tx.sigHashAllCopy(0, scriptPubKey)
        expect(hashSigPreimage).toBe('0100000001449d45bbbfe7fc93bbe649bb7b6106b248a15da5dbd6fdc9bdfc7efede83235e010000001976a914a235bdde3bb2c326f291d9c281fdc3fe1e956fe088acffffffff014062b007000000001976a914f86f0bc0a2232970ccdf4569815db500f126836188ac0000000001000000')

        const sigHash = await SHA256d.hashHex(hashSigPreimage)
        expect(sigHash.toHex()).toBe('8e2f535bbaf17d32f784259bede09b7dd27deacca836661f4dde3ba3a440fc63')
    })

})



// const tx = new StandardTransaction()
// tx.inputs.add('a8553d45f48c88adcbccd0676b9b6ff3f08241fdd7b85f1c8c01925bbcab150c',1)

// tx.outputs.add(1914000n, 'n4AYuETorj4gYKendz2ndm9QhjUuruZnfk')
// tx.inputs._inputs[0].scriptSig = new Script(new Uint8Array([0x01,0x75,0x01,0x52]))
// console.log(tx.toHex())






