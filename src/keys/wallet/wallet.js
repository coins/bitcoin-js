import { StandardTransaction } from '../../transaction/transaction.js'
import { TestnetPrivateKey } from '../private-key/private-key.js'


export async function pay(address, value) {
    const privateKey = await TestnetPrivateKey.import('91iscVTbXfBqkTCYRiF2ZvGvhDHW4TQxtDo6mGsDDGxMAQtMW1F')
    const tx = new StandardTransaction()
    tx.inputs.add('b9ee7ae0ad9dad39e9f404e40af5286ad2bc02d5cdb6666aaab89abd7926c0de', 0)
    tx.outputs.add(8000n, 'mg6WdcMMWXYYSoSrHpyeX7CkLrq9T5DEyt')
    const signed = await privateKey.sign(tx, 0)
    console.log('signed',tx.toHex())
}


