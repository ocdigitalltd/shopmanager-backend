import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdRelinkOrders from "../../../../modules/relinkOrders/mdRelinkOrders";
import MdOrderProducts from "../../../../modules/relinkOrders/orderProducts/mdOrderProducts";
import MdRelinkDomains from "../../../../modules/relinkDomains/mdRelinkDomains";

const { TABLE_NAME, col } = MdOrderProducts;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema
    .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    .createTable(TABLE_NAME, (table: CreateTableBuilder) => {
      table
        .uuid("id")
        .primary()
        .defaultTo(knex.raw("uuid_generate_v4()"))
        .notNullable();
      table.uuid("relinkOrderId").references(MdRelinkOrders.col("id", false))
        .inTable(MdRelinkOrders.TABLE_NAME).notNullable();
      table.string("productName").notNullable();
      table.string("productSize");
      table.string("surfaceType");
      table.string("productQuantity");
      table.string("productPrice");
      table.string("productSku").notNullable();
      table.string("businessUrlType").notNullable();
      table.string("businessUrl").notNullable();
      table.uuid("thirdLvlDomainId").references(MdRelinkDomains.col("id", false)).inTable(MdRelinkDomains.TABLE_NAME);
      table.boolean(col("isDomainCreated", false)).defaultTo(false).notNullable();
      table.timestamps(true, true);

      table.index("relinkOrderId", undefined, undefined);
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(TABLE_NAME);
}
