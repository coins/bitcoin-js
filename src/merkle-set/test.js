import { merkleRoot } from './merkle-set.js'
import { SHA256d } from './../../../hash-js/hash.js'

describe('The merkle-set lib', function() {
    it('can compute the Merkle root of a set', async function() {
        const hash1 = SHA256d.fromUnicode('abc')
        const hash2 = SHA256d.fromUnicode('def')
        const root = new SHA256d(await merkleRoot([hash1, hash2]))
        expect(root.toHex()).toBe('8e261adb033e68cc737c46085039ac2d96d4f4fe382d014d84b280585bd80973')
    })
})