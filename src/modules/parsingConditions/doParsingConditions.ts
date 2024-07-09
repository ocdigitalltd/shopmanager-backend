import BaseDao from "../../base/dao/doBase";
import MdParsingConditions from "./mdParsingConditions";

class DoParsingConditions extends BaseDao<MdParsingConditions> {
  constructor() {
    super(MdParsingConditions.TABLE_NAME);
  }
}

export default new DoParsingConditions();
