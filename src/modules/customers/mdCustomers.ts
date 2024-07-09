import MdBase from "../../base/model/mdBase";

class MdCustomers extends MdBase {
  static TABLE_NAME = "customers";

  constructor(
    public id?: string,
    public name?: string,
    public phone?: string,
    public email?: string,
    public alternateEmail?: string,
    public billingAddress?: string,
    public shippingAddress?: string,
    public addedBy?: "user" | "parsing" | "landing",
    public userId?: string,
    public incrementalId?: number,
  ) {
    super(id);
  }

  static col(k: keyof MdCustomers, prefix = true): string {
    return prefix ? `${MdCustomers.TABLE_NAME}.${k}` : k;
  }
}

export default MdCustomers;
