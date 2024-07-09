import DevelopmentConfig from "../../environment/developmentEnv";
import ProductionConfig from  "../../environment/productionEnv";

export type APP_ENV = "development" | "production";

class environmentLoader {
  static getEnv(env: APP_ENV): typeof DevelopmentConfig {
    if (env === "production") return ProductionConfig;
    return DevelopmentConfig;
  }
}

export default environmentLoader;
