import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdCronSettings from "../../../../modules/cronSettings/mdCronSettings";

const { TABLE_NAME, col } = MdCronSettings;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.boolean(col("useGoogleSheets", false)).notNullable().defaultTo(false);
    table.string(col("sheetsUrl", false));
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.dropColumn("useGoogleSheets");
    table.dropColumn("sheetsUrl");
  });
}
