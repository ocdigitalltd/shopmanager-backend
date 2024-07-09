import MdBase from "../../base/model/mdBase";
import { enumOrderStatus } from "./tpMailOrders";

class MdOrders extends MdBase {
  static TABLE_NAME = "orders";

  constructor(
    public id?: string,
    public gmailMsgId?: string,
    public mailSubject?: string,
    public name?: string,
    public orderNumber?: string,
    public phone?: string,
    public address?: string,
    public isValidAddress?: boolean,
    public orderDetails?: string,
    public isProcessed?: boolean,
    public orderStatus?: enumOrderStatus,
    public shopId?: string
  ) {
    super(id);
  }

  static col(k: keyof MdOrders, prefix = true): string {
    return prefix ? `${MdOrders.TABLE_NAME}.${k}` : k;
  }
}

export default MdOrders;
