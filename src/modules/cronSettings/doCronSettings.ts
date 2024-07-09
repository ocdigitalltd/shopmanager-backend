import BaseDao from "../../base/dao/doBase";
import MdCronSettings from "./mdCronSettings";

class DoCronSettings extends BaseDao<MdCronSettings> {
  constructor() {
    super(MdCronSettings.TABLE_NAME);
  }
}

export default new DoCronSettings();
