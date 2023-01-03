import { pick } from "common/util/other";
import { DEFAULT_META_INFO, PublicMetaFields } from "entities/meta";
import { makeGetMetaInfo } from "use-cases/meta/get-meta-info";

const db = Object.freeze({
  get: jest.fn(),
});

const getMetaInfo = makeGetMetaInfo({ db });

beforeEach(() => {
  Object.values(db).forEach((method) => method.mockReset());
});

describe("Functionality", () => {
  beforeEach(() => {
    db.get.mockResolvedValueOnce(DEFAULT_META_INFO);
  });

  it.each([
    {
      audience: "private",
      expectedResult: DEFAULT_META_INFO,
      case: "the complete meta info",
    },
    {
      audience: "public",
      case: "only the public meta info",
      expectedResult: pick(DEFAULT_META_INFO, PublicMetaFields),
    },
  ] as const)(
    `returns $case if the audience is "$audience"`,
    async ({ audience, expectedResult }) => {
      const metaInfo = await getMetaInfo({ audience });
      expect(metaInfo).toEqual(expectedResult);

      expect(db.get).toHaveBeenCalledTimes(1);
    }
  );
});
