import * as Knex from "knex";
import { QueryBuilder } from "knex";
import MdCustomers from "../../../../modules/customers/mdCustomers";

const { TABLE_NAME, col } = MdCustomers;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema.table(TABLE_NAME, table => {
    table.specificType(col("incrementalId", false), "bigserial").notNullable().unique();
  })
};

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table(TABLE_NAME, table => {
    table.dropColumn(col("incrementalId", false))
  })
};
