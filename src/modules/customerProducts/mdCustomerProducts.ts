import MdBase from "../../base/model/mdBase";

class MdCustomerProducts extends MdBase {
  static TABLE_NAME = "customer_products";

  constructor(
    public id?: string,
    public customerId?: string,
    public productName?: string,
    public surfaceType?: string,
    public businessUrlType?: string,
    public thirdLvlDomainId?: string,
    public productSku?: string,    
    public isPrimary?: boolean,
  ) {
    super(id);
  }

  static col(k: keyof MdCustomerProducts, prefix = true): string {
    return prefix ? `${MdCustomerProducts.TABLE_NAME}.${k}` : k;
  }
}

export default MdCustomerProducts;
