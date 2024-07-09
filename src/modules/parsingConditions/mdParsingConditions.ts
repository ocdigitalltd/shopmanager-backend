import MdBase from "../../base/model/mdBase";

class MdParsingConditions extends MdBase {
  static TABLE_NAME = "parsing_conditions";

  constructor(
    public id?: string,
    public condValue?: string,
    public condType?: "address" | "mail-subject" | "body" | "domainsAutoCreationThreshold" | "numOfDomainsToAutoCreate",
    public warehouseId?: string,
  ) {
    super(id);
  }

  static col(k: keyof MdParsingConditions, prefix = true): string {
    return prefix ? `${MdParsingConditions.TABLE_NAME}.${k}` : k;
  }
}

export default MdParsingConditions;
