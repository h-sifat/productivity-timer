import { DEFAULT_META_INFO } from "entities/meta";
import { makeUpdateMetaInfo } from "use-cases/meta/update-meta-info";

const db = Object.freeze({
  get: jest.fn(),
  set: jest.fn(),
});

const updateMetaInfo = makeUpdateMetaInfo({ db });

beforeEach(() => {
  Object.values(db).forEach((method) => method.mockReset());
});

describe("Functionality", () => {
  beforeEach(() => {
    db.get.mockResolvedValueOnce(DEFAULT_META_INFO);
  });

  it(`fetches the metaInfo from db then edits and updates it`, async () => {
    const changes = Object.freeze({ lastBackupTime: 24343 });
    const audience = "private";

    const edited = await updateMetaInfo({ changes, audience });
    expect(edited).toMatchObject(changes);

    expect(db.get).toHaveBeenCalledTimes(1);
    expect(db.set).toHaveBeenCalledTimes(1);
    expect(db.set).toHaveBeenCalledWith(edited);
  });

  it(`throws error if changes is invalid`, async () => {
    expect.assertions(3);

    const changes: any = Object.freeze({ unknown: 24343 });
    const audience = "private";

    try {
      await updateMetaInfo({ changes, audience });
    } catch (ex) {
      expect(ex.code).toBe("INVALID_CHANGES");
      expect(db.get).toHaveBeenCalledTimes(1);
      expect(db.set).not.toHaveBeenCalled();
    }
  });
});
