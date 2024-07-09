import MdBase from "../../base/model/mdBase";

class MdWarehouseSetup extends MdBase {
  static TABLE_NAME = "warehouse_setup";

  constructor(
    public channelType: "relink" | "shopify",
    public id?: string,
    public name?: string,
    public email?: string,
    public phone?: string,
    public parsingName?: string,
    public useLandingFlow?: boolean,
    public isDefault?: boolean,
  ) {
    super(id);
  }

  static col(k: keyof MdWarehouseSetup, prefix = true): string {
    return prefix ? `${MdWarehouseSetup.TABLE_NAME}.${k}` : k;
  }
}

export default MdWarehouseSetup;
