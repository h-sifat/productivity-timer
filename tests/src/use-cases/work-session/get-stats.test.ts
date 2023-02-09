import { deepFreeze } from "common/util/other";
import makeGetWorkSessionMaxId from "use-cases/work-session/get-stats";

const db = Object.freeze({ getStats: jest.fn() });
const getWorkSessionMaxId = makeGetWorkSessionMaxId({ db });

beforeEach(() => {
  Object.values(db).forEach((method) => method.mockReset());
});

it(`returns the return value of db.getStats()`, async () => {
  const fakeResult = deepFreeze([{ name: "a" }]);
  db.getStats.mockResolvedValueOnce(fakeResult);

  const result = await getWorkSessionMaxId();
  expect(result).toBe(fakeResult);
});
