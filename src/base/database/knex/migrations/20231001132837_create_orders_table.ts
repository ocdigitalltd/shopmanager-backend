import Knex, { CreateTableBuilder, QueryBuilder } from "knex";
import MdOrders from "../../../../modules/orderMail/mdMailOrders";

const { TABLE_NAME, col } = MdOrders;

export async function up(knex: Knex): Promise<QueryBuilder> {
  return knex.schema
    .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    .createTable(TABLE_NAME, (table: CreateTableBuilder) => {
      table
        .uuid("id")
        .primary()
        .defaultTo(knex.raw("uuid_generate_v4()"))
        .notNullable();
      table.string("gmailMsgId").notNullable(); 
      table.string("mailSubject").notNullable(); 
      table.string("name").notNullable(); 
      table.string("orderNumber").notNullable(); 
      table.string("phone").nullable(); 
      table.string("address").nullable(); 
      table.boolean("isValidAddress").nullable(); 
      table.jsonb("orderDetails").nullable(); 
      table.boolean("isProcessed").defaultTo(false).notNullable(); 
      table.timestamps(true, true);

      table.index("id", undefined, undefined); 
      table.index("gmailMsgId", undefined, undefined); 
      table.index("mailSubject", undefined, undefined); 
      table.index("name", undefined, undefined); 
      table.index("orderNumber", undefined, undefined); 
      table.index("phone", undefined, undefined); 
      table.index("address", undefined, undefined); 
      table.index("orderDetails", undefined, undefined); 
      table.index("isProcessed", undefined, undefined); 
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(TABLE_NAME);
}
