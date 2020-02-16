import { StandardTransaction } from '../../transaction/transaction.js'
import { TestnetPrivateKey } from '../private-key/private-key.js'


export async function pay(address, value) {
    const privateKey = await TestnetPrivateKey.import('91iscVTbXfBqkTCYRiF2ZvGvhDHW4TQxtDo6mGsDDGxMAQtMW1F')
    const tx = new StandardTransaction()
    tx.inputs.add('8c848d6084ba1c88b33d68e82301dce4bfcb072f51bad6a37e34561d7f8f68f4', 0)
    tx.outputs.add(8000n, 'mg6WdcMMWXYYSoSrHpyeX7CkLrq9T5DEyt')
    const signed = await privateKey.sign(tx, 0)
    console.log('signed',tx.toHex())
}


