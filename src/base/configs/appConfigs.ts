
abstract class AppConfigs {

   static shopifyTimeStart = new Date();
   static relinkTimeStart = new Date();
   static isShopifyRunning = false;
   static isRelinkRunning = false;
   static isRelinkSheetCronRunning = false;
   static misprintedDomainsData = {}
}

export default AppConfigs;
