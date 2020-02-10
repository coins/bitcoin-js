import { merkleRoot } from './merkle-set.js'
import { SHA256 } from './../../../hash-js/hash.js'

describe('Merkle Tree', function() {
    it('can compute a Merkle root', async function() {
        const hash1 = SHA256.fromUnicode('abc')
        const hash2 = SHA256.fromUnicode('def')
        const root = new SHA256(await merkleRoot([hash1, hash2]))
        expect(root.toHex()).toBe('8e261adb033e68cc737c46085039ac2d96d4f4fe382d014d84b280585bd80973');
    });
});