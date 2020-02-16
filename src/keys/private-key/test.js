import { PrivateKey, TestnetPrivateKey } from './private-key.js'

// Test vectors from: https://en.bitcoin.it/wiki/Private_key
describe('Keys - A private key', function() {

    it('can be generated', async function() {
        const privateKey = PrivateKey.generate()
        const address = await privateKey.toAddress()
        const exported = await privateKey.export()
        const imported = await PrivateKey.import(exported)
        const importedAddress = await imported.toAddress()

        expect(address).toBe(importedAddress)
    })


    it('can generate a Testnet address', async function() {
        const privateKey = await TestnetPrivateKey.import('92yMVPtwzsMDDHXhCxf6qexLXQwdHE7wwREc24E59nyzjAWXVAf')
        const address = await privateKey.toAddress()

        expect(address).toBe('mvJe9AfPLrxpfHwjLNjDAiVsFSzwBGaMSP')
    })
})