import makeGetWorkSessionMaxId from "use-cases/work-session/get-max-id";

const db = Object.freeze({ getMaxId: jest.fn() });
const getWorkSessionMaxId = makeGetWorkSessionMaxId({ db });

beforeEach(() => {
  db.getMaxId.mockReset();
});

it(`returns the return value of db.getMaxId`, async () => {
  const maxId = 234;
  db.getMaxId.mockResolvedValueOnce(maxId);

  const result = await getWorkSessionMaxId();
  expect(result).toBe(maxId);
});
