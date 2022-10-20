import { makeGetMaxId } from "data-access/util";

describe("makeGetMaxId", () => {
  const db = Object.freeze({
    prepare: jest.fn(),
    executePrepared: jest.fn(),
  });

  const maxIdColumnName = "maxId";
  const preparedQueryName = "cat/getMaxId";
  const preparedQueryStatement = "select max(id) from duck;";

  const getMaxId = makeGetMaxId({
    db,
    maxIdColumnName,
    preparedQueryName,
    preparedQueryStatement,
  });

  beforeEach(() => {
    Object.values(db).forEach((method) => method.mockReset());
  });

  it(`returns the maxId`, async () => {
    const maxId = 100;
    db.executePrepared.mockReturnValueOnce([{ [maxIdColumnName]: maxId }]);

    const result = await getMaxId();

    expect(result).toBe(maxId);

    expect(db.prepare).toHaveBeenCalledTimes(1);
    expect(db.executePrepared).toHaveBeenCalledTimes(1);

    expect(db.prepare).toHaveBeenCalledWith({
      name: preparedQueryName,
      overrideIfExists: false,
      statement: preparedQueryStatement,
    });

    expect(db.executePrepared).toHaveBeenCalledWith({
      name: preparedQueryName,
    });
  });

  it(`returns 1 if maxId is null (i.e. table is empty)`, async () => {
    db.executePrepared.mockReturnValueOnce([{ [maxIdColumnName]: null }]);

    const result = await getMaxId();
    expect(result).toBe(1);
  });
});
