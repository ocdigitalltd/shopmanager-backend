import MdBase from "../../base/model/mdBase";

class MdMisprintedCards extends MdBase {
  static TABLE_NAME = "misprinted_cards";

  constructor(
    public id: string,
    public domain: string,
    public businessurl: string,
    public status: "new" | "active",
  ) {
    super(id);
  }

  static col(k: keyof MdMisprintedCards, prefix = true): string {
    return prefix ? `${MdMisprintedCards.TABLE_NAME}.${k}` : k;
  }
}

export default MdMisprintedCards;
