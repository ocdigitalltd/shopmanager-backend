import MdBase from "../../base/model/mdBase";
import { tpUserRole } from "./tpUser";

class MdUser extends MdBase {
  static TABLE_NAME = "user";

  constructor(
    public id?: string,
    public email?: string,
    public password?: string,
    // new cols
    public username?:string,
    public role?: tpUserRole,
    public phone?: string,
    public loginSent?: boolean
  ) {
    super(id);
  }

  static col(k: keyof MdUser, prefix = true): string {
    return prefix ? `${MdUser.TABLE_NAME}.${k}` : k;
  }
}

export default MdUser;
