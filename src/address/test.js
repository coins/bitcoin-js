import { privateKeyToP2PKH } from './address.js'

// Test vector from: https://en.bitcoin.it/wiki/Private_key
describe('A Bitcoin address', function() {

    it('can be generated from a private key', async function() {
        const privateKey = BigInt('0xE9873D79C6D87DC0FB6A5778633389F4453213303DA61F20BD67FC233AA33262')
        const address = privateKeyToP2PKH(privateKey)
        expect(address).toBe('1CC3X2gu58d6wXUWMffpuzN9JAfTUWu4Kj')
    })

})