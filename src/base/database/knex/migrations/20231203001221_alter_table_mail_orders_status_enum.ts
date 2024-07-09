import * as Knex from "knex";
import MdOrders from "../../../../modules/orderMail/mdMailOrders";
import { enumOrderStatusList, enumOrderStatusListDep } from "../../../../modules/orderMail/tpMailOrders";


const { TABLE_NAME, col } = MdOrders;

export async function up(knex: Knex): Promise<void> {
  return knex.schema.raw(`
    ALTER TABLE "${TABLE_NAME}"
    DROP CONSTRAINT "${TABLE_NAME}_${col("orderStatus", false)}_check",
    ADD CONSTRAINT "${TABLE_NAME}_${col("orderStatus", false)}_check" CHECK (
    "${col("orderStatus", false)}" IN (${(enumOrderStatusList)
      .map((type) => `'${type}'`)})
    )`);
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.raw(`
    ALTER TABLE "${TABLE_NAME}"
    DROP CONSTRAINT "${TABLE_NAME}_${col("orderStatus", false)}_check",
    ADD CONSTRAINT "${TABLE_NAME}_${col("orderStatus", false)}_check" CHECK (
      '${col("orderStatus", false)}' IS NOT NULL or '${col("orderStatus", false)}'
      IN (${(enumOrderStatusListDep)
      .map((type) => `'${type}'`)})
    )`);
}