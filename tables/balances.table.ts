import { Asset, EMPTY_NAME, Name, Symbol, Table, U128 } from "proton-tsc";

/**
 * Represents the balance for a particular symbol.
 * @extends {Table}
 */
@table('balances')
export class BalancesTable extends Table {

  /**
   * Constructs a balance entry.
   * @param {Symbol} key - The symbol identifier for the balance entry. Defaults to 'XPR'.
   * @param {Name} contract - The name of the contract managing the asset. Defaults to an empty name.
   * @param {Asset} amount - The asset amount with its associated symbol. Defaults to 0 'XPR'.
   * @param {u64} lastClaim - The last claim timestamp. Defaults to 0.
   */
  constructor(
    public key: Symbol = new Symbol('XPR', 4),
    public contract: Name = EMPTY_NAME,
    public amount: Asset = new Asset(0, new Symbol('XPR', 4)),
    public lastClaim: u64 = 0
  ) {
    super()
  }


  @primary 
  /**
   * Get the value of the symbol as a u64.
   * @returns {u64} - The value of the symbol.
   */
  get by_key(): u64 {
    
    return this.key.value;

  }
  /**
   * Set the value of the symbol from a u64.
   * @param {u64} value - The value to set for the symbol.
   */
  set by_key(value:u64) {
    
    this.key = Symbol.fromU64(value);

  }

}