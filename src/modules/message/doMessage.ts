import BaseDao from "../../base/dao/doBase";
import MdMessage from "./mdMessage";

class DoMessage extends BaseDao<MdMessage> {
  constructor() {
    super(MdMessage.TABLE_NAME);
  }
}

export default new DoMessage();
