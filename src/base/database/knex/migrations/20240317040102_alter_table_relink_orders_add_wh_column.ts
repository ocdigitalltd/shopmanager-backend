import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdRelinkOrders from "../../../../modules/relinkOrders/mdRelinkOrders";

const { col, TABLE_NAME } = MdRelinkOrders;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.string(col("warehouseEmail", false));
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.dropColumn("warehouseEmail");
  });
}
