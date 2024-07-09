import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdCronSettings from "../../../../modules/cronSettings/mdCronSettings";

const { col, TABLE_NAME } = MdCronSettings;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.string(col("sheetName", false));
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.dropColumn("sheetName");
  });
}
