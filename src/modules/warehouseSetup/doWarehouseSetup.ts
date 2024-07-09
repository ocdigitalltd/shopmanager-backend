import BaseDao from "../../base/dao/doBase";
import MdWarehouseSetup from "./mdWarehouseSetup";

class DoWarehouseSetup extends BaseDao<MdWarehouseSetup> {
  constructor() {
    super(MdWarehouseSetup.TABLE_NAME);
  }
}

export default new DoWarehouseSetup();
