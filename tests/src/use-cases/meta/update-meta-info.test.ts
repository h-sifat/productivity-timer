import { DEFAULT_META_INFO } from "entities/meta";
import { makeUpdateMetaInfo } from "use-cases/meta/update-meta-info";

const db = Object.freeze({
  get: jest.fn(),
  set: jest.fn(),
});
const sideEffect = jest.fn();

const updateMetaInfo = makeUpdateMetaInfo({ db, sideEffect });

beforeEach(() => {
  Object.values(db).forEach((method) => method.mockReset());
  sideEffect.mockReset();
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
    expect(sideEffect).not.toHaveBeenCalled();
  });

  it(`throws error if changes is invalid`, async () => {
    expect.assertions(4);

    const changes: any = Object.freeze({ unknown: 24343 });
    const audience = "private";

    try {
      await updateMetaInfo({ changes, audience });
    } catch (ex) {
      expect(ex.code).toBe("INVALID_CHANGES");
      expect(db.get).toHaveBeenCalledTimes(1);
      expect(db.set).not.toHaveBeenCalled();
      expect(sideEffect).not.toHaveBeenCalled();
    }
  });

  it(`calls the sideEffect function after successful edit if the audience is "public"`, async () => {
    const updated = await updateMetaInfo({
      audience: "public",
      changes: {},
    });

    expect(sideEffect).toHaveBeenCalledTimes(1);
    expect(sideEffect).toHaveBeenCalledWith(updated);
  });
});
