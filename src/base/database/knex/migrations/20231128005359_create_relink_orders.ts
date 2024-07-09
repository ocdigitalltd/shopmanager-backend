import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdRelinkOrders from "../../../../modules/relinkOrders/mdRelinkOrders";
import { relinkOrderStatusList } from "../../../../modules/relinkOrders/tpRelinkOrders";

const { TABLE_NAME, col } = MdRelinkOrders;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema
    .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    .createTable(TABLE_NAME, (table: CreateTableBuilder) => {
      table
        .uuid("id")
        .primary()
        .defaultTo(knex.raw("uuid_generate_v4()"))
        .notNullable();
      table.string("gmailMsgId").unique().notNullable();
      table.integer("orderNum").unique().notNullable();
      table.string("customerName");
      table.string("orderTotal");
      table.text("billingAddress");
      table.text("shippingAddress").notNullable();
      table.string("phone").nullable();
      table.string("email").nullable();
      table.boolean("isItalian").defaultTo(false).notNullable();
      table.enum("orderStatus", relinkOrderStatusList).notNullable().defaultTo("new");

      table.timestamps(true, true);

      table.index("orderStatus", undefined, undefined);
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(TABLE_NAME);
}
