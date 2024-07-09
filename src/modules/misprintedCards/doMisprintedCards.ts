import BaseDao from "../../base/dao/doBase";
import MdMisprintedCards from "./mdMisprintedCards";

class DoMisprintedCards extends BaseDao<MdMisprintedCards> {
  constructor() {
    super(MdMisprintedCards.TABLE_NAME);
  }

}

export default new DoMisprintedCards();
