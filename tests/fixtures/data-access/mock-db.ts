import { is } from "handy-types";
import EPP from "common/util/epp";
import required from "common/util/required";

export interface QueryExecutorMethodArg {
  arg: any;
  method: string;
  reject(arg: unknown): void;
  resolve(arg: unknown): void;
}

type OnQuery_Argument = QueryExecutorMethodArg & { skipSignal: Symbol };
type OnQuery = ((arg: OnQuery_Argument) => Symbol | void) | null;

export default class MockDb<Key extends string | number, Type extends object> {
  protected readonly store: Map<Key, Type> = new Map();
  protected readonly queries: QueryExecutorMethodArg[] = [];
  protected isExecutingQueries = false;
  readonly #skipQueryExecutionSignal = Symbol();
  onAllQuery: OnQuery = null;
  onNextQuery: OnQuery = null;

  private executeQueries() {
    if (this.isExecutingQueries) return;

    this.isExecutingQueries = true;

    while (this.queries.length) {
      const query = this.queries.shift()!;
      const queryExecutorMethodName = `__${query.method}__`;

      if (!(queryExecutorMethodName in this))
        throw new EPP({
          code: "MOCK_DB:INTERNAL_ERROR",
          message: `No query executor method exists with name: "${queryExecutorMethodName}"`,
        });

      {
        const queryHookArg: OnQuery_Argument = {
          ...query,
          skipSignal: this.#skipQueryExecutionSignal,
        };

        if (this.onNextQuery) {
          const signal = this.onNextQuery(queryHookArg);

          this.onNextQuery = null;

          if (signal === this.#skipQueryExecutionSignal) continue;
        }

        if (this.onAllQuery) {
          const signal = this.onAllQuery(queryHookArg);
          if (signal === this.#skipQueryExecutionSignal) continue;
        }
      }

      // @ts-ignore
      this[queryExecutorMethodName](query);
    }

    this.isExecutingQueries = false;
  }

  async count(): Promise<number> {
    return this.enqueueQuery<number>({ arg: {}, method: "count" });
  }

  async insert(document: Type): Promise<Type> {
    this.assertValidId(document);

    return this.enqueueQuery<Type>({ arg: document, method: "insert" });
  }

  async insertMany(documents: Type[]): Promise<Type[]> {
    documents.forEach((document) => this.assertValidId(document));

    return this.enqueueQuery<Type[]>({ arg: documents, method: "insertMany" });
  }

  async findById(arg: { id: Key }): Promise<Type> {
    this.assertValidId(arg);

    return this.enqueueQuery<Type>({ arg, method: "findById" });
  }

  async find(): Promise<Type[]> {
    return this.enqueueQuery<Type[]>({ arg: {}, method: "find" });
  }

  async updateById(arg: { id: Key; changes: Partial<Type> }): Promise<Type> {
    this.assertValidId(arg);
    return this.enqueueQuery<Type>({ arg, method: "updateById" });
  }

  async deleteById(arg: { id: Key }): Promise<Type> {
    this.assertValidId(arg);
    return this.enqueueQuery<Type>({ arg, method: "deleteById" });
  }

  async deleteMany(arg: { ids: Key[] }): Promise<Type[]> {
    const { ids = required("ids") } = arg;
    for (const id of ids!) this.assertValidId({ id });

    return this.enqueueQuery<Type[]>({ arg, method: "deleteMany" });
  }

  /**
   * corruptById, __Lol__ :')
   * Set any value as a document to the given id. The document won't be
   * validated.
   * */
  async corruptById(arg: { id: Key; unValidatedDocument: any }): Promise<void> {
    this.assertValidId(arg);
    return this.enqueueQuery<void>({ arg, method: "corruptById" });
  }

  protected __corruptById__(query: QueryExecutorMethodArg) {
    const { arg, resolve, reject } = query;

    const { id, unValidatedDocument } = arg;
    this.__setDocument__({
      id,
      reject,
      callee: "corruptById",
      document: unValidatedDocument,
    });
    resolve(unValidatedDocument);
  }

  async clearDb(): Promise<void> {
    return this.enqueueQuery<void>({ arg: {}, method: "clearDb" });
  }

  protected __clearDb__(query: QueryExecutorMethodArg) {
    const { resolve } = query;
    this.__clearStore__();
    resolve(undefined);
  }

  protected __count__(query: QueryExecutorMethodArg) {
    const { resolve } = query;
    resolve(this.__getDbSize__());
  }

  protected __deleteById__(query: QueryExecutorMethodArg) {
    const { arg, resolve, reject } = query;
    const { id } = arg;

    if (!this.__hasDocument__(id)) return reject(this.getDocNotFoundError(id));

    const document = this.__getDocument__(id);
    this.__deleteDocument__(id);

    resolve(document);
  }

  protected __deleteMany__(query: QueryExecutorMethodArg) {
    const { arg, resolve } = query;

    const result: Type[] = [];

    for (const id of arg.ids)
      if (this.__hasDocument__(id)) {
        result.push(this.__getDocument__(id)!);
        this.__deleteDocument__(id);
      }

    resolve(result);
  }

  protected __updateById__(query: QueryExecutorMethodArg) {
    const { arg, resolve, reject } = query;
    const { id } = arg;

    if (!this.__hasDocument__(id)) return reject(this.getDocNotFoundError(id));

    const { changes } = arg;
    const newDoc = Object.freeze({
      ...this.__getDocument__(id),
      ...changes,
      id,
    });
    this.__setDocument__({
      id,
      reject,
      document: newDoc,
      callee: "updateById",
    });

    resolve(newDoc);
  }

  protected __findById__(query: QueryExecutorMethodArg) {
    const { arg, resolve } = query;
    const document = this.__getDocument__(arg.id);
    resolve(document || null);
  }

  protected __find__(query: QueryExecutorMethodArg) {
    const { resolve } = query;
    resolve(this.__getAllDocuments__());
  }

  protected __insert__(query: QueryExecutorMethodArg) {
    const { arg, resolve, reject } = query;

    const { id } = arg;

    if (!this.__hasDocument__(id))
      this.__setDocument__({
        id,
        reject,
        callee: "insert",
        document: Object.freeze(arg),
      });

    resolve(this.__getDocument__(id));
  }

  protected __insertMany__(query: QueryExecutorMethodArg) {
    const { arg: documents, resolve, reject } = query;

    const result: any[] = [];

    for (const doc of documents)
      if (this.__hasDocument__(doc.id))
        result.push(this.__getDocument__(doc.id));
      else {
        this.__setDocument__({
          reject,
          id: doc.id,
          callee: "insertMany",
          document: Object.freeze(doc),
        });
        result.push(Object.freeze(doc));
      }

    resolve(result);
  }

  protected enqueueQuery<Type>(
    arg: Pick<QueryExecutorMethodArg, "arg" | "method">
  ): Promise<Type> {
    return new Promise((resolve, reject) => {
      const query = { ...arg, resolve, reject };
      this.queries.push(query);
      this.executeQueries();
    });
  }

  // Utility
  protected assertValidId(arg: any) {
    const { id = required("id") } = arg;

    if (!is.cache<Key>("non_empty_string | positive_integer", id))
      throw new EPP(`Invalid id: "${id}"`, "INVALID_ID");
  }

  protected getDocNotFoundError(id: Key) {
    return new EPP({
      code: "NOT_FOUND",
      message: `No document exists with id: "${id}".`,
    });
  }

  protected __getDocument__(id: Key): Type | undefined {
    return this.store.get(id);
  }

  protected __getDbSize__(): number {
    return this.store.size;
  }

  protected __getAllDocuments__(): Type[] {
    return [...this.store.values()];
  }

  protected __setDocument__(arg: {
    id: Key;
    callee: string;
    document: Type;
    reject: (v: unknown) => void;
  }): Map<Key, Type> {
    const { id, document } = arg;
    return this.store.set(id, document);
  }

  protected __hasDocument__(id: Key): boolean {
    return this.store.has(id);
  }

  protected __deleteDocument__(id: Key): boolean {
    return this.store.delete(id);
  }
  protected __clearStore__() {
    return this.store.clear();
  }
}
