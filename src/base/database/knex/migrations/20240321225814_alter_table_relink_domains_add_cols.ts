import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdRelinkDomains from "../../../../modules/relinkDomains/mdRelinkDomains";
import MdSku from "../../../../modules/sku/mdSku";

const { col, TABLE_NAME } = MdRelinkDomains;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.enum(col("redirectType", false), ["landing1", "landing2"]).nullable();
    table.uuid(col("skuId", false)).references(MdSku.col("id", false)).inTable(MdSku.TABLE_NAME);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.dropColumn("redirectType");
    table.dropColumn("skuId");
  });
}
