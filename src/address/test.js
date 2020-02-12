import { privateKeyToP2PKH } from './address.js'

// Test vector from: https://en.bitcoin.it/wiki/Private_key
describe('A Bitcoin address', function() {

    it('can be generated from a private key', async function() {
        const privateKey = BigInt('0x18e14a7b6a307f426a94f8114701e7c8e774e7f9a47e2c2035db29a206321725')
        const address = await privateKeyToP2PKH(privateKey)
        expect(address).toBe('1PMycacnJaSqwwJqjawXBErnLsZ7RkXUAs')
    })

})