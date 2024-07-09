import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdRelinkOrders from "../../../../modules/relinkOrders/mdRelinkOrders";
import MdWarehouseSetup from "../../../../modules/warehouseSetup/mdWarehouseSetup";

const { col, TABLE_NAME } = MdRelinkOrders;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.uuid(col("warehouseId", false)).
      references(MdWarehouseSetup.col("id", false)).inTable(MdWarehouseSetup.TABLE_NAME);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.dropColumn("warehouseId");
  });
}
