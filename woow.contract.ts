import { Asset, Contract, Name, Symbol, TableStore, U256, Utils, check, currentTimeMs, printHex, requireAuth } from "proton-tsc";
import { PaymentsTable, StoreTable, BalancesTable } from "./tables";
import { AWAIT_PAYMENT, CANCELED_PAYMENT, FULLFILED_PAYMENT, PAYEDOUT_PAYMENT, REFUNDED_PAYMENT } from "./constants";
import { sendTransferToken } from "proton-tsc/token";


/**
* The main contract class for the `wookey` escrow contract.
*/
@contract
export class wookey extends Contract {
    
    private storesTable: TableStore<StoreTable> = new TableStore<StoreTable>(this.receiver);
    private paymentsTable: TableStore<PaymentsTable> = new TableStore<PaymentsTable>(this.receiver);

    /**
     * Handles token transfers.
     * @param {Name} from - Sender's account name.
     * @param {Name} to - Receiver's account name.
     * @param {Asset} quantity - Amount of tokens to be transferred.
     * @param {string} memo - Additional information about the transfer.
     */
    @action('transfer', notify)
    onTransfer(from:Name,to:Name,quantity:Asset,memo:string): void {
    
        if (from == this.receiver) return;
        if (memo == 'WOOKEY') return;
        const memoToKey = Utils.hexToBytes(memo);
        const u256Memo = U256.fromBytes(memoToKey)
        const payment = this.paymentsTable.getBySecondaryU256(u256Memo, 0);
        check(!!payment, 'Woow error: Payment not found');
        if (!payment) return;
        check(payment.status !== CANCELED_PAYMENT, 'Woow error: Payment has been previously canceled');
        check(payment.status !== FULLFILED_PAYMENT, 'Woow error: Payment has been previously completed');
        payment.status = FULLFILED_PAYMENT;
        const now = currentTimeMs();
        payment.updated = now;
        const balanceTable: TableStore<BalancesTable> = new TableStore<BalancesTable>(this.receiver, payment.store);
        if (balanceTable.exists(quantity.symbol.value)) {

            const transferBalance = balanceTable.get(quantity.symbol.value);
            check(!!transferBalance, 'Woow error: Error while fetching the balance')
            if (!transferBalance) return;
            transferBalance.amount.symbol = quantity.symbol;
            transferBalance.amount.amount += quantity.amount;
            balanceTable.update(transferBalance, this.receiver)

        } else { 

            const newBalance = new BalancesTable(quantity.symbol)
            newBalance.amount.symbol = quantity.symbol;
            newBalance.amount.amount += quantity.amount;
            newBalance.contract = payment.tokenContract;
            balanceTable.store(newBalance,this.receiver)

        }
        this.paymentsTable.update(payment, this.receiver);
        

    }

    /**
     * Registers a store.
     * @param {Name} storeAccount - Store's account name.
     */
    @action('store.reg')
    registerStore(storeAccount: Name): void {
        
        requireAuth(storeAccount);
        const storeExists = this.storesTable.exists(storeAccount.N);
        if (storeExists) return;
        const newStore = new StoreTable(storeAccount, false);
        this.storesTable.store(newStore, this.receiver);

    }
    
    /**
     * Unregisters a store.
     * @param {Name} storeAccount - Store's account name.
     */
    @action('store.unreg')
    unregisterStore(storeAccount: Name): void {
        
        requireAuth(storeAccount);
        const storeToDelete = this.storesTable.requireGet(storeAccount.N,'Store not registrated');
        if (!storeToDelete) return;
        this.storesTable.remove(storeToDelete);

    }

    /**
     * Registers a payment.
     * @param {Name} storeAccount - Store's account name.
     * @param {Name} buyer - Buyer's account name.
     * @param {string} paymentKey - Unique key used for payment reconciliation.
     * @param {Asset} amount - Amount of the payment with symbol.
     * @param {Name} tokenContract - Token contract name.
     */
    @action("pay.reg")
    registerPayment(storeAccount: Name, buyer: Name, paymentKey: string, amount: Asset,tokenContract:Name): void {
        
        requireAuth(buyer);
        const storeExists = this.storesTable.exists(storeAccount.N);
        check(storeExists, 'Woow error: Store not exits');
        if (!storeExists) return;

        const paymentKeyToBytes = Utils.hexToBytes(paymentKey);
        const u256Key = U256.fromBytes(paymentKeyToBytes)

        const payment = this.paymentsTable.getBySecondaryU256(u256Key, 0);
        check(!payment, 'Error: Duplicated Payment ');
        const now = currentTimeMs();
        const newPayment = new PaymentsTable(
            this.paymentsTable.availablePrimaryKey,
            storeAccount,
            buyer,
            u256Key,
            amount,
            tokenContract,
            AWAIT_PAYMENT,
            now,
            0

        );
        this.paymentsTable.store(newPayment, this.receiver);   
    }

    /**
     * Refunds a payment if not already withdrawn. 
     * @param {Name} storeAccount - Store's account name.
     * @param {string} paymentKey - Unique key for the payment.
     */
    @action('pay.refund')
    refundPayment(storeAccount: Name, paymentKey: string): void{
        
        requireAuth(storeAccount);
        const storeExists = this.storesTable.exists(storeAccount.N);
        check(storeExists, 'Woow error: Store not exits');
        if (!storeExists) return;

        const paymentKeyToBytes = Utils.hexToBytes(paymentKey);
        const u256Key = U256.fromBytes(paymentKeyToBytes)

        const payment = this.paymentsTable.getBySecondaryU256(u256Key, 0);
        check(!!payment, 'Woow error: Payment not exists');
        if (!payment) return;
        const now = currentTimeMs();
        

        sendTransferToken(payment.tokenContract, this.receiver, payment.buyer, payment.amount, '');
        payment.status = REFUNDED_PAYMENT;
        this.paymentsTable.update(payment, this.receiver);   
        
        const balanceTable: TableStore<BalancesTable> = new TableStore<BalancesTable>(this.receiver, storeAccount);
        const fromBalance = balanceTable.requireGet(payment.amount.symbol.value, 'Woow error: Balance not exists');
        fromBalance.amount.amount -= payment.amount.amount
        balanceTable.update(fromBalance, this.receiver);


    }
    
    /**
     * Cancels a payment.
     * @param {Name} storeAccount - Store's account name.
     * @param {U256} paymentKey - Unique key for the payment.
     */
    @action("pay.cancel")
    cancelPayment(storeAccount:Name,paymentKey: U256): void {
        
        requireAuth(storeAccount);
        const payment = this.paymentsTable.getBySecondaryU256(paymentKey, 0);
        check(!!payment, 'Error: Payment not exists ');
        if (!payment) return;
        check(payment.store == storeAccount, 'Error: unauthorized account');
        if (payment.store != storeAccount) return;
        payment.status = CANCELED_PAYMENT
        this.paymentsTable.update(payment, this.receiver);   
    }

    /**
     * Claims balance.
     * @param {Name} storeAccount - Store's account name.
     * @param {Symbol} symbol - Symbol of the token.
     */
    @action("bal.claim")
    claimBalance(storeAccount: Name,symbol:Symbol):void {
        
        requireAuth(storeAccount);
        const storeExists = this.storesTable.exists(storeAccount.N);
        check(storeExists, 'Woow error: Store not exists');
        if (!storeExists) return;
        
        const balanceTable: TableStore<BalancesTable> = new TableStore<BalancesTable>(this.receiver, storeAccount);
        const claimBalance = balanceTable.requireGet(symbol.value, 'Woow error: Balance not exists');
        if(claimBalance.amount.amount <= 0)return ;
        sendTransferToken(claimBalance.contract, this.receiver, storeAccount, claimBalance.amount, `${symbol.getSymbolString()} payout`)
        claimBalance.amount.amount = 0;
        const now = currentTimeMs();
        this.markPaymentsAsPayedOut(storeAccount, claimBalance.lastClaim,claimBalance.key);
        claimBalance.lastClaim = now;
        balanceTable.update(claimBalance,this.receiver)

    }

    @action("dev.clrpay")
    clearPayments(): void {
        
        while (!this.paymentsTable.isEmpty()) {
            const paymentToRemove = this.paymentsTable.first();
            
            if (paymentToRemove) {
                this.paymentsTable.remove(paymentToRemove);
            }
        }

    }
    
    @action("dev.clrstore")
    clearStore(): void {
        
        while (!this.storesTable.isEmpty()) {
            const storeToRemove = this.storesTable.first();
            
            if (storeToRemove) {
                this.storesTable.remove(storeToRemove);
            }
        }

    }
    
    @action("dev.clrbal")
    clearBalance(storeAccount:Name): void {
        
        const balanceTable: TableStore<BalancesTable> = new TableStore<BalancesTable>(this.receiver, storeAccount);
        while (!balanceTable.isEmpty()) {
            const balanceToRemove = balanceTable.first();
            
            if (balanceToRemove) {
                balanceTable.remove(balanceToRemove);
            }
        }

    }

    /**
     * Marks payments as paid out.
     * @param {Name} storeAccount - Store's account name.
     * @param {i64} since - Timestamp indicating when the payments were updated.
     * @param {Symbol} symbol - Symbol of the token.
     * @private
     */

    private markPaymentsAsPayedOut(storeAccount: Name, since: i64,symbol:Symbol): void {
        
        let payment = this.paymentsTable.getBySecondaryU64(storeAccount.N, 1);
        if (!payment) return;
        payment = this.markSinglePaymentAsPayedOut(payment, since, symbol)
        let res = '';
        while (payment) {
            res = `${res} ${payment.key} ${payment.amount.symbol.getSymbolString()}`
            payment = this.paymentsTable.nextBySecondaryU64(payment, 1);
            if (!payment) break ;
            payment = this.markSinglePaymentAsPayedOut(payment,since,symbol)
            if (!payment) break;
        }
    }

    /**
     * Marks a single payment as paid out.
     * @param {PaymentsTable} payment - The payment to be marked.
     * @param {i64} since - Timestamp indicating when the payment is updated.
     * @param {Symbol} symbol - Symbol of the token.
     * @returns {PaymentsTable} The marked payment.
     * @private
     */
    private markSinglePaymentAsPayedOut(payment:PaymentsTable, since: i64,symbol:Symbol): PaymentsTable { 
        
        if ( payment.created > since && payment.status == FULLFILED_PAYMENT && payment.amount.symbol.value == symbol.value ) { 

            payment.updated = since;
            payment.status = PAYEDOUT_PAYMENT;
            this.paymentsTable.update(payment, this.receiver);

        }

        return payment

    }
}
