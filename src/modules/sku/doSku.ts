import BaseDao from "../../base/dao/doBase";
import MdSku from "./mdSku";

class DoSku extends BaseDao<MdSku> {
  constructor() {
    super(MdSku.TABLE_NAME);
  }
}

export default new DoSku();
