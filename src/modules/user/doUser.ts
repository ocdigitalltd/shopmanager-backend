import BaseDao from "../../base/dao/doBase";
import MdUser from "./mdUser";

class DoUser extends BaseDao<MdUser> {
  constructor() {
    super(MdUser.TABLE_NAME);
  }
}

export default new DoUser();
