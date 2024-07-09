import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdUser from "../../../../modules/user/mdUser";

const { TABLE_NAME, col } = MdUser;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema
    .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    .createTable(TABLE_NAME, (table: CreateTableBuilder) => {
      table
        .uuid("id")
        .primary()
        .defaultTo(knex.raw("uuid_generate_v4()"))
        .notNullable();
      table.string("email").notNullable().unique();
      table.text("password").notNullable(); 
      table.timestamps(true, true);

      table.index("id", undefined, undefined); 
      table.index("email", undefined, undefined); 
      table.index("password", undefined, undefined); 
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(TABLE_NAME);
}
