import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdRelinkOrders from "../../../../modules/relinkOrders/mdRelinkOrders";
import MdCustomers from "../../../../modules/customers/mdCustomers";

const { TABLE_NAME } = MdRelinkOrders;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.uuid("customerId")
      .references(MdCustomers.col("id", false)).inTable(MdCustomers.TABLE_NAME).notNullable();
      table.dropColumn("customerName");
      table.dropColumn("billingAddress");
      table.dropColumn("shippingAddress");
      table.dropColumn("phone");
      table.dropColumn("email");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table(TABLE_NAME, (table: CreateTableBuilder) => {
    table.dropColumn("customerId");
    table.text("billingAddress");
    table.text("shippingAddress").notNullable();
    table.string("phone").nullable();
    table.string("email").nullable();
    table.string("customerName");
  });
}
