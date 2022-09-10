import Category from "entities/category";
import makeCategoryIfNotCorrupted from "use-cases/category/util";

describe("Validation", () => {
  const errorCode = "CATEGORY_CORRUPTED_IN_DB";
  const sampleCategoryRecord = new Category({ name: "study" }).toPlainObject();

  {
    const reason = "HASH_MISMATCH";

    it(`throws ewc "${errorCode}"  with reason: "${reason}" if generated hash doesn't match the hash in categoryRecord`, () => {
      expect.assertions(2);

      const categoryRecord = {
        ...sampleCategoryRecord,
        name: sampleCategoryRecord.name + "_", // changing the so hash doesn't match
      };

      try {
        makeCategoryIfNotCorrupted({
          categoryRecord,
          CategoryClass: Category,
        });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
        expect(ex.reason).toBe(reason);
      }
    });
  }

  {
    const reason = "INVALID_FIELD";
    it(`throws ewc "${errorCode}" with reason: "${reason}" if any category field is invalid in the categoryRecord`, () => {
      expect.assertions(2);

      const categoryRecord = {
        ...sampleCategoryRecord,
        id: ["non_numeric_string"],
      };

      try {
        makeCategoryIfNotCorrupted({
          // @ts-ignore
          categoryRecord,
          CategoryClass: Category,
        });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
        expect(ex.reason).toBe(reason);
      }
    });
  }
});
