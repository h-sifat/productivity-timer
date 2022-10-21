import makeGetProjectMaxId from "use-cases/project/get-max-id";

const db = Object.freeze({ getMaxId: jest.fn() });
const getProjectMaxId = makeGetProjectMaxId({ db });

beforeEach(() => {
  db.getMaxId.mockReset();
});

it(`returns the return value of db.getMaxId`, async () => {
  const maxId = 234;
  db.getMaxId.mockResolvedValueOnce(maxId);

  const result = await getProjectMaxId();
  expect(result).toBe(maxId);
});
