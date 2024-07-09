import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdCustomers from "../../../../modules/customers/mdCustomers";
import MdUser from "../../../../modules/user/mdUser";

const { TABLE_NAME, col } = MdCustomers;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema
    .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    .createTable(TABLE_NAME, (table: CreateTableBuilder) => {
      table
        .uuid("id")
        .primary()
        .defaultTo(knex.raw("uuid_generate_v4()"))
        .notNullable();
      table.string(col("name", false));
      table.string(col("phone", false));
      table.string(col("email",false)).notNullable();
      table.string(col("alternateEmail",false));
      table.enum(col("addedBy", false), ["parsing", "user", "landing"]).notNullable().defaultTo("parsing");
      table.uuid(col("userId", false)).references(MdUser.col("id", false))
      .inTable(MdUser.TABLE_NAME).notNullable();   
      table.text("billingAddress");
      table.text("shippingAddress");
      table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(TABLE_NAME);
}
