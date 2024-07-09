import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdUser from "../../../../modules/user/mdUser";

const { TABLE_NAME, col } = MdUser;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.enum(col("role", false), ["admin", "customer"]).notNullable().defaultTo("customer");
    table.string(col("username", false));
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.dropColumn("role");
    table.dropColumn("username");
  });
}
