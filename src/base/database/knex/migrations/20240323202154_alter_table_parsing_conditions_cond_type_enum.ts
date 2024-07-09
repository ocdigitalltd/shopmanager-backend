import * as Knex from "knex";
import MdParsingConditions from "../../../../modules/parsingConditions/mdParsingConditions";

const { TABLE_NAME, col } = MdParsingConditions;

export async function up(knex: Knex): Promise<void> {
  return knex.schema.raw(`
    ALTER TABLE "${TABLE_NAME}"
    DROP CONSTRAINT "${TABLE_NAME}_${col("condType", false)}_check",
    ADD CONSTRAINT "${TABLE_NAME}_${col("condType", false)}_check" CHECK (
    "${col("condType", false)}" IN (${(["address", "mail-subject", "body", "domainsAutoCreationThreshold" , "numOfDomainsToAutoCreate"])
      .map((type) => `'${type}'`)})
    )`);
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.raw(`
    ALTER TABLE "${TABLE_NAME}"
    DROP CONSTRAINT "${TABLE_NAME}_${col("condType", false)}_check",
    ADD CONSTRAINT "${TABLE_NAME}_${col("condType", false)}_check" CHECK (
      '${col("condType", false)}' IS NOT NULL or '${col("condType", false)}'
      IN (${(["address", "mail-subject", "body", "domainsAutoCreationThreshold" , "numOfDomainsToAutoCreate"])
      .map((type) => `'${type}'`)})
    )`);
}