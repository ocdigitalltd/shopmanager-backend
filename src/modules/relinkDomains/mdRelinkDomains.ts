import MdBase from "../../base/model/mdBase";

class MdRelinkDomains extends MdBase {
  static TABLE_NAME = "relink_domains";

  constructor(
    public sku: string,
    public redirectUrl: string,
    public thirdLvlDomain: string,
    public createdBy: "user" | "system",
    public isActive: boolean,
    public incrementalId: number,
    public redirectType: string, // landing1 || landing2
    public skuId: string,
    public isFixed?: boolean,
    public id?: string,
  ) {
    super(id);
  }

  static col(k: keyof MdRelinkDomains, prefix = true): string {
    return prefix ? `${MdRelinkDomains.TABLE_NAME}.${k}` : k;
  }
}

export default MdRelinkDomains;
