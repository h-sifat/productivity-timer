import {
  normalizeDocumentToRecord,
  normalizeRecordToDocument,
} from "data-access/work-session-db/util";
import { SAMPLE_WORK_SESSION } from "fixtures/entities/work-session";

describe("normalizeDocumentToRecord", () => {
  it(`normalizes a document to record`, () => {
    const record = normalizeDocumentToRecord(SAMPLE_WORK_SESSION);

    expect(record).toMatchObject({
      id: expect.any(Number),
      startedAt: expect.any(Number),
      ref: { id: expect.any(Number) },
      elapsedTime: {
        byDate: expect.any(Array),
      },
    });
  });
});

describe("normalizeRecordToDocument", () => {
  test("normalizeRecordToDocument should convert a record to a document", () => {
    const record = normalizeDocumentToRecord(SAMPLE_WORK_SESSION);
    const document = normalizeRecordToDocument(record);

    expect(document).toEqual(SAMPLE_WORK_SESSION);
    expect(Object.isFrozen(document)).toBeTruthy();
  });
});
