import type { ReadonlyDeep } from "type-fest";
import { deepFreeze } from "common/util/other";
import { validateDailyStat } from "data-access/work-session-db/stats";
import type { DailyStat } from "use-cases/interfaces/work-session-db";

const validDailyStat: ReadonlyDeep<DailyStat> = deepFreeze({
  date: Date.now(),
  totalDurationMs: 1000,
  durationPerRefs: [{ duration: 1000, ref: { id: "a", type: "category" } }],
});

it(`doesn't throw error if stat is valid`, () => {
  expect(() => {
    validateDailyStat([validDailyStat]);
  }).not.toThrow();
});

{
  const errorCode = "INVALID_STAT";
  it(`throws error with code "${errorCode}" if stat is invalid`, () => {
    expect.assertions(1);

    try {
      validateDailyStat([{ ...validDailyStat, date: -1 }]);
    } catch (ex) {
      expect(ex.code).toBe(errorCode);
    }
  });
}
