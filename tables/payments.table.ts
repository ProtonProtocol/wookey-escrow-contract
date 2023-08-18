import { AWAIT_PAYMENT } from "./../constants";
import { Asset, EMPTY_NAME, Name, Symbol, Table, U256 } from "proton-tsc";


/**
 * Represents a payment entry in the table.
 * @extends {Table}
*/

@table('payments')
export class PaymentsTable extends Table {

  /**
   * Constructs a payment entry.
   * @param {u64} key - The unique identifier for the payment. Defaults to 0.
   * @param {Name} store - The store associated with the payment. Defaults to an empty name.
   * @param {Name} buyer - The buyer's name. Defaults to an empty name.
   * @param {U256} paymentKey - The payment key. Defaults to U256(0,0).
   * @param {Asset} amount - The amount being paid. Defaults to 0 'XPR'.
   * @param {Name} tokenContract - The token contract name. Defaults to 'eosio.token'.
   * @param {i32} status - The status of the payment. Defaults to AWAIT_PAYMENT.
   * @param {i64} created - Timestamp of when the payment was created. Defaults to 0.
   * @param {i64} updated - Timestamp of the last update to the payment. Defaults to 0.
   */
  constructor(
    public key: u64 = 0,
    public store: Name = EMPTY_NAME,
    public buyer: Name = EMPTY_NAME,
    public paymentKey: U256 =new U256(0,0),
    public amount: Asset = new Asset(0, new Symbol('XPR', 4)),
    public tokenContract: Name = Name.fromString('eosio.token'),
    public status: i32 = AWAIT_PAYMENT,
    public created:i64 = 0,
    public updated:i64 = 0,
    
  ) {
    super()
  }

  @primary
  /**
   * Get the unique identifier for the payment.
   * @returns {u64} - The unique identifier.
   */
  get by_key(): u64 {  
    return this.key
  }

  /**
   * Set the unique identifier for the payment.
   * @param {u64} value - The value to set for the identifier.
   */
  set by_key(value: u64) {
    this.key = value;
  }

  @secondary
  /**
   * Get the payment key.
   * @returns {U256} - The payment key.
   */
  get by_paymentKey(): U256 {
    return this.paymentKey
  }
  
  /**
   * Set the payment key.
   * @param {U256} value - The value to set for the payment key.
   */
  set by_paymentKey(value:U256) {
    this.paymentKey = value
  }
  
  @secondary
  /**
   * Get the store's unique identifier.
   * @returns {u64} - The store's unique identifier.
   */
  get by_store(): u64 {
    return this.store.N
  }
  
  /**
   * Set the store's unique identifier.
   * @param {u64} value - The value to set for the store's unique identifier.
   */
  set by_store(value:u64) {
    this.store = Name.fromU64(value)
  }



}