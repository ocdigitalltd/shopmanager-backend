import MdBase from "../../../base/model/mdBase";

class MdOrderProducts extends MdBase {
  static TABLE_NAME = "order_products";

  constructor(
    public id?: string,
    public relinkOrderId?: string,     // relink_orders table
    public productName?: string,
    public productSize?: string,
    public surfaceType?: string,
    public productQuantity?: string,
    public productPrice?: string,
    public businessUrlType?: string,
    public businessUrl?: string,
    public thirdLvlDomainId?: string,
    public isDomainCreated?:boolean,
    public productSku?: string
  ) {
    super(id);
  }

  static col(k: keyof MdOrderProducts, prefix = true): string {
    return prefix ? `${MdOrderProducts.TABLE_NAME}.${k}` : k;
  }
}

export default MdOrderProducts;
