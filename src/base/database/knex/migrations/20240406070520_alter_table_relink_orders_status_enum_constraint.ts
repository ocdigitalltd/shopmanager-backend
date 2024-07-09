import * as Knex from "knex";
import MdRelinkOrders from "../../../../modules/relinkOrders/mdRelinkOrders";
import { relinkOrderStatusList, relinkOrderStatusListOld } from "../../../../modules/relinkOrders/tpRelinkOrders";

const { TABLE_NAME, col } = MdRelinkOrders;

export async function up(knex: Knex): Promise<void> {
  return knex.schema.raw(`
    ALTER TABLE "${TABLE_NAME}"
    DROP CONSTRAINT "${TABLE_NAME}_${col("orderStatus", false)}_check",
    ADD CONSTRAINT "${TABLE_NAME}_${col("orderStatus", false)}_check" CHECK (
    "${col("orderStatus", false)}" IN (${(relinkOrderStatusList)
      .map((type) => `'${type}'`)})
    )`);
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.raw(`
    ALTER TABLE "${TABLE_NAME}"
    DROP CONSTRAINT "${TABLE_NAME}_${col("orderStatus", false)}_check",
    ADD CONSTRAINT "${TABLE_NAME}_${col("orderStatus", false)}_check" CHECK (
      '${col("orderStatus", false)}' IS NOT NULL or '${col("orderStatus", false)}'
      IN (${(relinkOrderStatusListOld)
      .map((type) => `'${type}'`)})
    )`);
}