import MdBase from "../../base/model/mdBase";

class MdCronSettings extends MdBase {
  static TABLE_NAME = "cron_settings";

  constructor(
    public id?: string,
    public startCron?: boolean,
    public scheduleIntervalInMins?: number,
    public delayAfterMessageFetchInMins?: number,
    public isRunning?: boolean,
    public processType?: "shopify" | "relink" | "domain-creation",
    public useGoogleSheets?: boolean,
    public sheetsUrl?: string,
    public sheetName?: string
  ) {
    super(id);
  }

  static col(k: keyof MdCronSettings, prefix = true): string {
    return prefix ? `${MdCronSettings.TABLE_NAME}.${k}` : k;
  }
}

export default MdCronSettings;
