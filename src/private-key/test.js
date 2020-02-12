import * as WIF from './wallet-import-format.js'
import PrivateKey from './private-key.js'

// Test vectors from: https://en.bitcoin.it/wiki/Private_key
describe('A private key', function() {

    it('can be encoded and decoded as WIF', async function() {
        const private_key_bigint = BigInt('0x0C28FCA386C7A227600B2FE50B7CAE11EC86D3BF1FBE471BE89827E19D72AA1D')
        const private_key_WIF = '5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ'
        const encoded = await WIF.encode(private_key_bigint)
        expect(encoded).toBe(private_key_WIF)
        const decoded = await WIF.decode(encoded)
        expect(decoded).toBe(private_key_bigint)
    })

    it('can be generated', async function() {
        const privateKey = PrivateKey.generate()
        const address = await privateKey.toAddress()
        const exported = await privateKey.toWIF()
        const imported = await PrivateKey.fromWIF(exported)
        const importedAddress = await imported.toAddress()

        expect(address).toBe(importedAddress)
    })
})