import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdWarehouseSetup from "../../../../modules/warehouseSetup/mdWarehouseSetup";

const { TABLE_NAME } = MdWarehouseSetup;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema.createTable(TABLE_NAME, (table: CreateTableBuilder) => {
    table
      .uuid("id")
      .primary()
      .defaultTo(knex.raw("uuid_generate_v4()"))
      .notNullable();
    table.string("name");
    table.string("email").notNullable();
    table.string("parsingName");
    table.boolean("useLandingFlow").defaultTo(false).notNullable();
    table.boolean("isDefault").defaultTo(false).notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(TABLE_NAME);
}
