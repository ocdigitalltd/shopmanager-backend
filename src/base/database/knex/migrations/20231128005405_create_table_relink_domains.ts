import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdRelinkDomains from "../../../../modules/relinkDomains/mdRelinkDomains";

const { TABLE_NAME, col } = MdRelinkDomains;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema
    .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    .createTable(TABLE_NAME, (table: CreateTableBuilder) => {
      table
        .uuid("id")
        .primary()
        .defaultTo(knex.raw("uuid_generate_v4()"))
        .notNullable();
      table.string("sku");
      table.string("redirectUrl");
      table.string("thirdLvlDomain").unique();
      table.boolean(col("isActive", false)).defaultTo(false).notNullable();
      table.enum(col("createdBy", false), ["system", "user"]).notNullable().defaultTo("system");
      table.specificType(col("incrementalId", false), "bigserial").notNullable().unique();
      table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(TABLE_NAME);
}
