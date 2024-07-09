import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdMessage from "../../../../modules/message/mdMessage";

const { col, TABLE_NAME } = MdMessage;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.enum(col("scope", false), ["shopify", "relink", "user-login"]).notNullable().defaultTo("shopify");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.dropColumn("scope");
  });
}
