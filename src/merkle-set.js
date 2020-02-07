async function merkleRoot(set) {
    if (set.length == 0)
        return
    if (set.length < 2)
        return new Hash(set[0]);

    const next = [];
    for (let i = 0; i < set.length / 2; i++) {
        const i1 = 2 * i;
        const i2 = Math.min(i1 + 1, set.length - 1); // duplicate odd
        const digest = await dSHA256(Buffer.concat(set[i1], set[i2]))
        next.push(digest)
    }

    return merkleRoot(next);
}

async function merklePath(set, index) {
    if (set.length == 0)
        return;
    if (set.length < 2)
        return [ ];

    const next = [];
    for (let i = 0; i < set.length / 2; i++) {
        const i1 = 2 * i;
        const i2 = Math.min(i1 + 1, set.length - 1); // duplicate odd
        const digest = await dSHA256(Buffer.concat(set[i1], set[i2]));
        next.push(digest);
    }

    const orientation = index % 2;
    const siblingIndex = index + ( orientation ? -1 : 1 ) ;
    const sibling = {
        orientation,
        hash : set[siblingIndex]
    };

    const nextIndex = Math.floor( index / 2 );
	const path = await merklePath(next, nextIndex);
	path.push(sibling);

    return path;
}


class MerklePath {
    
    constructor(path){
        this._path = path
    }

    static async fromSet(set, index){
        const path = await merklePath(set, index);
        path.reverse();
        return new MerklePath(path);
    }

    async merkleRoot( hash ){

        for(let i = 0; i < this._path.length; i++){
            const node = this._path[i];
            let hash1 = hash;
            let hash2 = node.hash;
            
            if(node.orientation){
                const temp = hash1;
                hash1 = hash2;
                hash2 = temp;
            }

            hash = await dSHA256(Buffer.concat(hash1, hash2));
        }

        return new Hash(hash);
    }

    async verify(hash, root){
        const pathRoot = await this.merkleRoot( hash );
        return Buffer.equals(pathRoot, root);
    }

}

