import * as WIF from './wallet-import-format.js'

// Test vectors from: https://en.bitcoin.it/wiki/Private_key
describe('Keys - The WIF import format', function() {

    it('can be encode and decode private keys', async function() {
        const private_key_bigint = BigInt('0x0C28FCA386C7A227600B2FE50B7CAE11EC86D3BF1FBE471BE89827E19D72AA1D')
        const private_key_WIF = '5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ'
        const encoded = await WIF.encode(private_key_bigint)
        const decoded = await WIF.decode(encoded)

        expect(encoded).toBe(private_key_WIF)
        expect(decoded).toBe(private_key_bigint)
    })

    it('can be encode and decode private keys', async function() {
        const private_key_bigint = BigInt('0xB6A42D01917404B740F9EF9D5CEF08E13F998011246874DD65C033C4669E7009')
        const private_key_WIF = '92yMVPtwzsMDDHXhCxf6qexLXQwdHE7wwREc24E59nyzjAWXVAf'
        const encoded = await WIF.encode(private_key_bigint, 'TESTNET')
        const decoded = await WIF.decode(encoded, 'TESTNET')

        expect(encoded).toBe(private_key_WIF)
        expect(decoded).toBe(private_key_bigint)
    })

})