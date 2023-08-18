import { EMPTY_NAME, Name, Table } from "proton-tsc";

/**
 * Represents a store in the table.
 * @extends {Table}
 */
@table('stores')
export class StoreTable extends Table {

  /**
   * Creates a new StoreTable instance.
   * @param {Name} store - The name of the store.
   * @param {boolean} blacklisted - Flag indicating if the store is blacklisted.
   */
  constructor(
    public store: Name = EMPTY_NAME,
    public blacklisted:boolean = false
  ) {
    super()
  }

  @primary
  /**
   * Getter for the primary key based on the store's name.
   * @returns {u64} - The primary key.
   */
  get by_store(): u64 {
    
    return this.store.N

  }

  /**
   * Setter for the primary key.
   * @param {u64} value - The value to set for the primary key.
   */
  set by_store(value: u64) {
    this.store = Name.fromU64(value);
  }



}