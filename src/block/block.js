export class Block {
	
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


export class Transactions {
	
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


