import MdBase from "../../base/model/mdBase";

class MdSku extends MdBase {
  static TABLE_NAME = "sku";

  constructor(
    public id: string,
    public sku: string,
  ) {
    super(id);
  }

  static col(k: keyof MdSku, prefix = true): string {
    return prefix ? `${MdSku.TABLE_NAME}.${k}` : k;
  }
}

export default MdSku;
