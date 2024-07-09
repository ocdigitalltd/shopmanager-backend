import MdBase from "../../base/model/mdBase";

class MdMessage extends MdBase {
  static TABLE_NAME = "message";

  constructor(
    public id?: string,
    public key?: string,
    public value?: string,
    public scope?: "shopify" | "relink" | "user-login"
  ) {
    super(id);
  }

  static col(k: keyof MdMessage, prefix = true): string {
    return prefix ? `${MdMessage.TABLE_NAME}.${k}` : k;
  }
}

export default MdMessage;
