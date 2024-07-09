import {SessionUserType} from "../../src/shared/modules/shared/types/tpShared.ts";

declare module "express-session" {

  export interface SessionData {
    user: SessionUserType;
  }
}
