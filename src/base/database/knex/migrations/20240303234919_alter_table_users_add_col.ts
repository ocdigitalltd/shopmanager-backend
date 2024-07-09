import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdUser from "../../../../modules/user/mdUser";

const { TABLE_NAME, col } = MdUser;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.boolean(col("loginSent", false)).notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.dropColumn("loginSent");
  });
}
