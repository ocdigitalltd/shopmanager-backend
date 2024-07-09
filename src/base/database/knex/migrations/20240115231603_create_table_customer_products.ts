import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdRelinkDomains from "../../../../modules/relinkDomains/mdRelinkDomains";
import MdCustomerProducts from "../../../../modules/customerProducts/mdCustomerProducts";
import MdCustomers from "../../../../modules/customers/mdCustomers";

const { TABLE_NAME, col } = MdCustomerProducts;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema
    .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    .createTable(TABLE_NAME, (table: CreateTableBuilder) => {
      table
        .uuid("id")
        .primary()
        .defaultTo(knex.raw("uuid_generate_v4()"))
        .notNullable();
      table.uuid("customerId").references(MdCustomers.col("id", false))
        .inTable(MdCustomers.TABLE_NAME).notNullable();
      table.string("productName");
      table.string("surfaceType");
      table.string("productSku");
      table.string("businessUrlType");
      table.uuid("thirdLvlDomainId")
      .references(MdRelinkDomains.col("id", false)).inTable(MdRelinkDomains.TABLE_NAME).notNullable();
      table.boolean(col("isPrimary", false)).defaultTo(false).notNullable();
      table.timestamps(true, true);

      table.index("thirdLvlDomainId", undefined, undefined);
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(TABLE_NAME);
}
