import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdWarehouseSetup from "../../../../modules/warehouseSetup/mdWarehouseSetup";
import MdParsingConditions from "../../../../modules/parsingConditions/mdParsingConditions";

const { TABLE_NAME, col } = MdParsingConditions;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema.createTable(TABLE_NAME, (table: CreateTableBuilder) => {
    table
      .uuid("id")
      .primary()
      .defaultTo(knex.raw("uuid_generate_v4()"))
      .notNullable();
    table.string("condValue").notNullable();
    table.enum("condType", ["address", "mail-subject", "body"]).defaultTo("body").notNullable();
    table.uuid("warehouseId").references("id").inTable(MdWarehouseSetup.TABLE_NAME).notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(TABLE_NAME);
}
