class Block {
	
	constructor(header, transactions){
		this.header = header;
		this.transactions = transactions;
		this.verifyMerkleRoot();
	}

	async verifyMerkleRoot(){
		const root = await this.transactions.merkle()
		const isValid = Buffer.equals(this.header.hashMerkleRoot, root );
		console.log('Merkle Root Valid', isValid);
		return isValid;
	}

	static fromHex(rawTxHex){
		const tx = Block.read( new HexReader( rawTxHex ) );
		return tx;
	}

	write(writer){
		this.header.write(writer);
		this.transactions.write(writer);
	}

	static read(reader){
		const header = BlockHeader.read(reader);
		const transactions = Transactions.read(reader);
		return new Block(header, transactions);
	}

	async blockId(){
		return this.header.blockId();
	}

	byteLength(){
		return this.header.byteLength()
			+ this.transactions.byteLength();
	}
}

class BlockHeader {
	
	constructor(version, hashPrevBlock, hashMerkleRoot, timeStamp, bits, nonce){
		this.version = version;
		this.hashPrevBlock = hashPrevBlock;
		this.hashMerkleRoot = hashMerkleRoot;
		this.timeStamp = timeStamp;
		this.bits = bits;
		this.nonce = nonce;
	}

	write(writer){
		this.version.write(writer);
		this.hashPrevBlock.write(writer);
		this.hashMerkleRoot.write(writer);
		this.timeStamp.write(writer);
		this.bits.write(writer);
		this.nonce.write(writer);
	}

	static read(reader){
		const version = Uint32.read(reader);
		const hashPrevBlock = Hash.read(reader);
		const hashMerkleRoot = Hash.read(reader);
		const timeStamp = TimeStamp.read(reader);
		const bits = Bits.read(reader);
		const nonce = Uint32.read(reader);
		return new BlockHeader(version, hashPrevBlock, hashMerkleRoot, timeStamp, bits, nonce);
	}

	byteLength(){
		return this.version.byteLength()
			+ this.hashPrevBlock.byteLength()
			+ this.hashMerkleRoot.byteLength()
			+ this.timeStamp.byteLength()
			+ this.bits.byteLength()
			+ this.nonce.byteLength();
	}

	toBuffer(){
		const buffer = new Uint8Array( this.byteLength() );
		const writer = new Writer( buffer );
		this.write( writer );
		return writer.result();
	}

	async blockId(){
		const txCopy = this.toBuffer();
		const hash = await dSHA256(txCopy);
		return new Hash(hash);
	}

	async verifyPrev(prevHeader){
		const prevId = await prevHeader.blockId();
		return Buffer.equals(this.hashPrevBlock, prevId);
	}

	async verifyProofOfWork(){
		const proof = (await this.blockId()).toBigInt();
		return this.bits.difficulty > proof;
	}
}

class TimeStamp extends Uint32 {
	
	constructor(value){
		super(value);
		this.formatted = new Date( value * 1000 );
	}

}

class Bits extends Uint32{
	
	constructor(bits){
		super(bits);
		this.difficulty = BigInt(bits) * 2n**(8n*(0x1bn - 3n));
	}

}

class Transactions {
	
	constructor(transactionsCount, transactions){
		this.transactionsCount = transactionsCount;
		this.transactions = transactions;
	}

	write(writer){
		this.transactionsCount.write(writer); 
		this.transactions.forEach( transaction => transaction.write(writer) );
	}

	static read(reader){
		const transactionsCount = VarInt.read(reader);
		const transactions = [];
		for(let i=0; i < transactionsCount; i++){
			const transaction = Transaction.read( reader );
			transactions.push( transaction );
		}
		return new Transactions( transactionsCount, transactions );
	}

	byteLength(){
		return this.transactionsCount.byteLength()
			+ this.transactions.reduce( (sum, transaction) => sum + transaction.byteLength(), 0);
	}

	async merkle(){
		const transactionHashs = this.transactions.map( tx => tx.txid() );
		const set = await Promise.all( transactionHashs );
		const root = await merkleRoot(set);
		return root;
	}

	async merkleProof(index){
		const transactionHashs = this.transactions.map( tx => tx.txid() );
		const set = await Promise.all( transactionHashs );
		return MerklePath.fromSet(set,index);
	}
}



function fetchRawBlock(blockId){
	const url = `https://blockchain.info/rawblock/${blockId}?format=hex&cors=true`;
	return fetch(url).then( r => r.text() );
}

async function fetchBlock(blockId){
	const rawBlockHex = await fetchRawBlock(blockId);
	const block = Block.fromHex(rawBlockHex);
	return block;
}


