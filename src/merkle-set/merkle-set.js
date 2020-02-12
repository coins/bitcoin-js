import { sha256d } from '../../../hash-js/hash.js'
import * as Buffer from '../../../buffer-js/src/buffer-utils.js'

export async function merkleRoot(set) {
    if (set.length == 0)
        return
    if (set.length < 2)
        return sha256d(set[0])

    const next = [];
    for (let i = 0; i < set.length / 2; i++) {
        const i1 = 2 * i;
        const i2 = Math.min(i1 + 1, set.length - 1); // duplicate odd
        const digest = await sha256d(Buffer.concat(set[i1], set[i2]))
        next.push(digest)
    }

    return merkleRoot(next);
}

export async function merklePath(set, index) {
    if (set.length == 0)
        return;
    if (set.length < 2)
        return [];

    const next = [];
    for (let i = 0; i < set.length / 2; i++) {
        const i1 = 2 * i;
        const i2 = Math.min(i1 + 1, set.length - 1); // duplicate odd
        const digest = await sha256(Buffer.concat(set[i1], set[i2]));
        next.push(digest);
    }

    const orientation = index % 2;
    const siblingIndex = index + (orientation ? -1 : 1);
    const sibling = {
        orientation,
        hash: set [siblingIndex]
    };

    const nextIndex = Math.floor(index / 2);
    const path = await merklePath(next, nextIndex);
    path.push(sibling);

    return path;
}
