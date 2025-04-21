import * as helpers from "../";

describe("router5-helpers", () => {
  describe(".startsWithSegment()", () => {
    it("should return true if a route starts with a segment", () => {
      expect(helpers.startsWithSegment("a.b.c", "a")).toStrictEqual(true);
      expect(helpers.startsWithSegment("a.b.c", "a.b")).toStrictEqual(true);
      expect(helpers.startsWithSegment({ name: "a.b.c" }, "a")).toStrictEqual(
        true,
      );
    });

    it("should return false if a route does not start with a segment", () => {
      expect(helpers.startsWithSegment("a.b.c", "aa")).toStrictEqual(false);
      expect(helpers.startsWithSegment("a.b.c", "a.a")).toStrictEqual(false);
      expect(helpers.startsWithSegment({ name: "a.b.c" }, "aa")).toStrictEqual(
        false,
      );
    });
  });

  describe(".endsWithSegment()", () => {
    it("should return true if a route ends with a segment", () => {
      expect(helpers.endsWithSegment("a.b.c", "c")).toStrictEqual(true);
      expect(helpers.endsWithSegment({ name: "a.b.c" }, "c")).toStrictEqual(
        true,
      );
    });

    it("should return false if a route does not end with a segment", () => {
      expect(helpers.endsWithSegment("a.b.c", "cc")).toStrictEqual(false);
      expect(helpers.endsWithSegment({ name: "a.b.c" }, "cc")).toStrictEqual(
        false,
      );
    });
  });

  describe(".includesSegment()", () => {
    it("should return true if a route includes a segment", () => {
      expect(helpers.includesSegment("a.b.c", "a")).toStrictEqual(true);
      expect(helpers.includesSegment("a.b.c", "a.b")).toStrictEqual(true);
      expect(helpers.includesSegment("a.b.c", "a.b.c")).toStrictEqual(true);
      expect(helpers.includesSegment("a.b.c", "b")).toStrictEqual(true);
      expect(helpers.includesSegment("a.b.c", "c")).toStrictEqual(true);
    });

    it("should return false if a route does not include a segment", () => {
      expect(helpers.includesSegment("a.b.c", "aa")).toStrictEqual(false);
      expect(helpers.includesSegment("a.bb.c", "a.b")).toStrictEqual(false);
      expect(helpers.includesSegment("a.b.c", "bb.c")).toStrictEqual(false);
      expect(helpers.includesSegment("a.b.c", "a.b.b")).toStrictEqual(false);
    });
  });
});
