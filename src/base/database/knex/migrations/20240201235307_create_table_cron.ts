import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdCronSettings from "../../../../modules/cronSettings/mdCronSettings";

const { TABLE_NAME } = MdCronSettings;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema.createTable(TABLE_NAME, (table: CreateTableBuilder) => {
    table
      .uuid("id")
      .primary()
      .defaultTo(knex.raw("uuid_generate_v4()"))
      .notNullable();
    table.boolean("startCron").defaultTo(false).notNullable();
    table.integer("scheduleIntervalInMins").notNullable().defaultTo(0);
    table.integer("delayAfterMessageFetchInMins").notNullable().defaultTo(0);
    table.boolean("isRunning").defaultTo(false).notNullable();
    table.enum("processType", ["shopify", "relink"]).notNullable().unique();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(TABLE_NAME);
}
