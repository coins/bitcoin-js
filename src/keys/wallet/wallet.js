import { StandardTransaction } from '../../transaction/transaction.js'
import { TestnetPrivateKey } from '../private-key/private-key.js'


// @see https://bitcoin.stackexchange.com/questions/3374/how-to-redeem-a-basic-tx/5241#5241
export async function pay(address, value) {
    const privateKey = await TestnetPrivateKey.import('91iscVTbXfBqkTCYRiF2ZvGvhDHW4TQxtDo6mGsDDGxMAQtMW1F')
    
    // const privateKey = await TestnetPrivateKey.import('cThjSL4HkRECuDxUTnfAmkXFBEg78cufVBy3ZfEhKoxZo6Q38R5L')
    console.log('my address', await privateKey.toAddress())
    const tx = new StandardTransaction()
    tx.inputs.add('300a3125191522528418f8bb79f92d33110962c27c9b4099e553b2f2916bfe37', 0)

    tx.outputs.add(8000n, 'mfp4bZsPdDKg6N6o8TFmuKZH6bg5GgWwJL')

    console.log(tx.toHex())
    const signed = await privateKey.signTransaction(tx, 0)
    console.log('signed', tx.toHex(), tx)
}