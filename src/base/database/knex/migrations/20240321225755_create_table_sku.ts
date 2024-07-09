import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdSku from "../../../../modules/sku/mdSku";

const { TABLE_NAME } = MdSku;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema.createTable(TABLE_NAME, (table: CreateTableBuilder) => {
    table
      .uuid("id")
      .primary()
      .defaultTo(knex.raw("uuid_generate_v4()"))
      .notNullable();
    table.string("sku").notNullable().unique();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(TABLE_NAME);
}
