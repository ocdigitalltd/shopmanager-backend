import knex from "knex";
import { Env } from "../loaders/appLoader";

export default knex(Env.knex);
