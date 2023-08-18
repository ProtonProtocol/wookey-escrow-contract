import { Blockchain, nameToBigInt } from "@proton/vert";
import { Name } from "proton-tsc";

async function wait(ms: number) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

async function main() {
    const blockchain = new Blockchain();
    const contract = blockchain.createContract('woow', 'target/woow.contract');
    await wait(0);
    
    // Put you actions calls here
    await contract.actions.blurb([]).send('woow@active');
    await wait(0);
    const table = contract.tables!.payment(nameToBigInt('woow')).getTableRows();
    console.log(table)
        //store.findTable(BigInt('woow'), BigInt('woow'), BigInt('payement'));
    
}

main();
