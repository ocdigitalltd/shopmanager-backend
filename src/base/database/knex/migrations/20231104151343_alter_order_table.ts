import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdOrders from "../../../../modules/orderMail/mdMailOrders";
import { enumOrderStatusListDep } from "../../../../modules/orderMail/tpMailOrders";

const { TABLE_NAME, col } = MdOrders;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.enum("orderStatus", enumOrderStatusListDep).notNullable().defaultTo("new");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.dropColumn("orderStatus");
  });
}
