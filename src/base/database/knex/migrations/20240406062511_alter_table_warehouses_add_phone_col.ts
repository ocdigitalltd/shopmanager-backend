import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdWarehouseSetup from "../../../../modules/warehouseSetup/mdWarehouseSetup";

const { TABLE_NAME, col } = MdWarehouseSetup;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.string(col("phone", false));
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.dropColumn("phone");
  });
}
