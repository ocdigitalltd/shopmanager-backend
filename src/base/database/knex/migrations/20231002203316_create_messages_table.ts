import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdMessage from "../../../../modules/message/mdMessage";

const { TABLE_NAME, col } = MdMessage;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema
    .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    .createTable(TABLE_NAME, (table: CreateTableBuilder) => {
      table
        .uuid("id")
        .primary()
        .defaultTo(knex.raw("uuid_generate_v4()"))
        .notNullable();
      table.string("key").notNullable().unique();
      table.text("value").notNullable(); 
      table.timestamps(true, true);

      table.index("id", undefined, undefined); 
      table.index("key", undefined, undefined); 
      table.index("value", undefined, undefined); 
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(TABLE_NAME);
}
