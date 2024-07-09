import MdBase from "../../base/model/mdBase";
import { tpRelinkOrderStatus } from "./tpRelinkOrders";

class MdRelinkOrders extends MdBase {
  static TABLE_NAME = "relink_orders";

  constructor(
    public id?: string,
    public gmailMsgId?: string,
    public orderNum?: number,
    // public customerName?: string,
    public orderTotal?: string,
    // public phone?: string,
    // public email?: string,
    // public billingAddress?: string,
    // public shippingAddress?: string,
    public customerId?: string,
    public isItalian?: boolean,
    public orderStatus?: tpRelinkOrderStatus,
    public warehouseEmail?: string,
    public warehouseId?: string
  ) {
    super(id);
  }

  static col(k: keyof MdRelinkOrders, prefix = true): string {
    return prefix ? `${MdRelinkOrders.TABLE_NAME}.${k}` : k;
  }
}

export default MdRelinkOrders;
