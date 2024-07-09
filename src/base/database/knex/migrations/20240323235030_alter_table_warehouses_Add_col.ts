import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdWarehouseSetup from "../../../../modules/warehouseSetup/mdWarehouseSetup";

const { col, TABLE_NAME } = MdWarehouseSetup;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.enum(col("channelType", false), ["relink", "shopify"]).notNullable().defaultTo("relink");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.dropColumn("channelType");
  });
}
