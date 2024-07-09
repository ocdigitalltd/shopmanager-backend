import * as Knex from "knex";
import MdCronSettings from "../../../../modules/cronSettings/mdCronSettings";

const { TABLE_NAME, col } = MdCronSettings;

export async function up(knex: Knex): Promise<void> {
  return knex.schema.raw(`
    ALTER TABLE "${TABLE_NAME}"
    DROP CONSTRAINT "${TABLE_NAME}_${col("processType", false)}_check",
    ADD CONSTRAINT "${TABLE_NAME}_${col("processType", false)}_check" CHECK (
    "${col("processType", false)}" IN (${(["shopify", "relink", "domain-creation"])
      .map((type) => `'${type}'`)})
    )`);
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.raw(`
    ALTER TABLE "${TABLE_NAME}"
    DROP CONSTRAINT "${TABLE_NAME}_${col("processType", false)}_check",
    ADD CONSTRAINT "${TABLE_NAME}_${col("processType", false)}_check" CHECK (
      '${col("processType", false)}' IS NOT NULL or '${col("processType", false)}'
      IN (${(["shopify", "relink"])
      .map((type) => `'${type}'`)})
    )`);
}