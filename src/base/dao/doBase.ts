import { QueryBuilder, Transaction } from "knex";

abstract class BaseModel {
  createdAt?: string;
  protected constructor(public id?: string) {}
}

type DefaultOperators = "=" | "LIKE";

class BaseDao<
  Model extends BaseModel,
  TableColumn extends string | number | symbol = keyof Model
> {
  protected tableName: string;
  protected returnedCols = "*";

  protected getColumn(column: TableColumn, withTablePrefix = false): string {
    return withTablePrefix
      ? `${this.tableName}.${String(column)}`
      : (column as string);
  }

  constructor(tableName: string) {
    this.tableName = tableName;
  }
  getAll<Model>(trx: Transaction, fields: TableColumn[] | string = "*"): QueryBuilder<Model[], Model[]> {
    return trx(this.tableName)
      .select(fields);
  }


  getAllModels<Model>(
    trx: Transaction,
    fields: TableColumn[] | string = "*"
  ): QueryBuilder<Model[], Model[]> {
    return trx(this.tableName).select(fields);
  }

  findAllPickField(
    trx: Transaction,
    fields: TableColumn
  ): QueryBuilder<Model[], Model[]> {
    return trx(this.tableName).pluck(fields as string);
  }

  findAllByPredicatePickField(
    trx: Transaction,
    predicate: Partial<Model>,
    pick: TableColumn
  ): QueryBuilder<string[], string[]> {
    return trx(this.tableName)
      .where(predicate)
      .pluck(pick as string);
  }

  findAllWhereColInPick(
    trx: Transaction,
    field: TableColumn | string,
    value: string[],
    pick: TableColumn
  ): QueryBuilder<string[]> {
    return trx(this.tableName)
      .select(field)
      .whereIn(field as string, value)
      .pluck(pick as string);
  }

  findAllByCol(
    trx: Transaction,
    colName: TableColumn,
    value: string,
    fields: TableColumn[] | string = "*",
    operator: DefaultOperators = "="
  ): QueryBuilder<Model[], Model[]> {
    return trx(this.tableName)
      .select(fields)
      .where(colName as string, operator, value) as QueryBuilder<
      Model[],
      Model[]
    >;
  }

  findOneByCol(
    trx: Transaction,
    colName: TableColumn,
    value: string | number,
    fields: TableColumn[] | string = "*"
  ): QueryBuilder<Model, Model> {
    return trx(this.tableName)
      .where(colName as string, value)
      .first(fields);
  }

  findOneById(trx: Transaction, id: string): QueryBuilder<Model, Model> {
    return this.findOneByCol(trx, "id" as TableColumn, id);
  }

  insertMany(
    trx: Transaction,
    models: Model[] | Model | Partial<Model>,
    fields: TableColumn[] | string = this.returnedCols
  ): QueryBuilder<Model[], Model[]> {
    return trx(this.tableName)
      .insert(models)
      .returning(fields as string[]);
  }

  insertOne(
    trx: Transaction,
    model: Model | Partial<Model>,
    fields: TableColumn[] | string = this.returnedCols
  ): QueryBuilder<Model[], Model[]> {
    return this.insertMany(trx, model, fields).limit(1);
  }

  updateOneByColName(
    trx: Transaction,
    model: Partial<Model>,
    colName: TableColumn,
    colValueByUpdate: string
  ): QueryBuilder<Model[], Model[]> {
    return trx(this.tableName)
      .update(model)
      .where(colName as string, colValueByUpdate)
      .limit(1)
      .returning(this.returnedCols) as QueryBuilder<Model[], Model[]>;
  }

  updateOneById(
    trx: Transaction,
    model: Partial<Model>,
    id: string
  ): QueryBuilder<Model[], Model[]> {
    return this.updateOneByColName(
      trx,
      model as Required<Model>,
      "id" as TableColumn,
      id
    );
  }

  deleteOneByCol(
    trx: Transaction,
    col: TableColumn,
    val: string
  ): QueryBuilder<number> {
    return trx(this.tableName)
      .del()
      .limit(1)
      .where(col as string, val);
  }

  deleteOneById(trx: Transaction, id: string): QueryBuilder<number> {
    return this.deleteOneByCol(trx, "id" as TableColumn, id);
  }

  findOneByPredicate(
    trx: Transaction,
    predicate: Partial<Model>,
    fields: TableColumn[] | string = "*"
  ): QueryBuilder<Model, Model> {
    return trx(this.tableName).where(predicate).first(fields);
  }
  updateOneByPredicate(
    trx: Transaction,
    model: Partial<Model>,
    predicate: Partial<Model>
  ): QueryBuilder<Model[], Model[]> {
    return trx(this.tableName)
      .update(model)
      .where(predicate)
      .limit(1)
      .returning(this.returnedCols) as QueryBuilder<Model[], Model[]>;
  }

  findAllByPredicate(
    trx: Transaction,
    predicate: Partial<Model>,
    fields: TableColumn[] | string = "*"
  ): QueryBuilder<Model[], Model[]> {
    return trx(this.tableName).select(fields).where(predicate) as QueryBuilder<
      Model[],
      Model[]
    >;
  }

  upsertMany(
    trx: Transaction, models: Model[] | Model | Partial<Model>,
    conflictConstraint: TableColumn[] | string, updateFields?: Partial<Model>
  ): QueryBuilder<Model[], Model[]> {
    return trx(this.tableName)
      .insert(models)
      .onConflict(conflictConstraint as string)
      .merge(updateFields)
      .returning(this.returnedCols);
  }

  upsertOne(
    trx: Transaction, models: Model[] | Model | Partial<Model>,
    conflictConstraint: TableColumn[] | string,
  ): QueryBuilder<Model[], Model[]> {
    return trx(this.tableName)
      .insert(models)
      .onConflict(conflictConstraint as string)
      .ignore()
      .returning(this.returnedCols);
  }
}

export default BaseDao;
