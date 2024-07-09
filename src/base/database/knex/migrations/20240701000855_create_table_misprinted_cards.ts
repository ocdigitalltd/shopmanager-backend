import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdMisprintedCards from "../../../../modules/misprintedCards/mdMisprintedCards";

const {col, TABLE_NAME } = MdMisprintedCards;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema.createTable(TABLE_NAME, (table: CreateTableBuilder) => {
    table
      .uuid("id")
      .primary()
      .defaultTo(knex.raw("uuid_generate_v4()"))
      .notNullable();
    table.string("domain").notNullable().unique();
    table.string("businessurl");
    table.enum(col("status", false), ["new", "active"]).notNullable().defaultTo("new");
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(TABLE_NAME);
}
