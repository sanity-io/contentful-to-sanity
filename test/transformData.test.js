const assert = require("assert");
const transformData = require("../src/transformData");
const hr = require("./fixtures/hrexport.json");

describe("transformData", () => {
  describe("RichText", () => {
    it("handles HR", () => {
      const res = transformData(hr);
      const doc = res[0];
      assert(doc, "Didnt produce document");
      expect(doc.body[1]._type).toBe("break");
    });
  });
});
