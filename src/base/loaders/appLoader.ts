import environmentLoader, { APP_ENV } from "./environmentLoader";

export const env: APP_ENV | string = process.env.NODE_ENV
  ? process.env.NODE_ENV
  : "development";
export const Env = environmentLoader.getEnv(env as APP_ENV);
