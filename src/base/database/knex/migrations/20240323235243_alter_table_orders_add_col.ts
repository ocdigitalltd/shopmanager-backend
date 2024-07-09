import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdOrders from "../../../../modules/orderMail/mdMailOrders";
import MdWarehouseSetup from "../../../../modules/warehouseSetup/mdWarehouseSetup";
import { SHOPIFY_SETTING_ID } from "../seeds/seed";

const { TABLE_NAME, col } = MdOrders;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.uuid(col("shopId", false)).references(MdWarehouseSetup.col("id", false))
      .inTable(MdWarehouseSetup.TABLE_NAME).notNullable().defaultTo(SHOPIFY_SETTING_ID);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.dropColumn("shopId");
  });
}
