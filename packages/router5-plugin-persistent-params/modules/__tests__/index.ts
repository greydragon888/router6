import persistentParamsPlugin from "..";
import { createRouter } from "router5";
import type { Router } from "router5";

let router: Router;
const createTestRouter = () =>
  createRouter([
    { name: "route1", path: "/route1/:id" },
    { name: "route2", path: "/route2/:id" },
  ]);

describe("Persistent params plugin", () => {
  describe("with an array", () => {
    beforeEach(() => {
      router = createTestRouter();

      router.usePlugin(persistentParamsPlugin(["mode"]));
    });
    afterEach(() => {
      router.stop();
    });

    it("should persist specified parameters", () => {
      router.start("route1");
      router.navigate("route2", { id: "2" }, {}, (_err, state) => {
        expect(state?.path).toBe("/route2/2");
        router.navigate(
          "route1",
          { id: "1", mode: "dev" },
          {},
          (_err, state) => {
            expect(state?.path).toBe("/route1/1?mode=dev");

            router.navigate("route2", { id: "2" }, {}, (_err, state) => {
              expect(state?.path).toBe("/route2/2?mode=dev");
            });
          },
        );
      });
    });

    it("should save value on start", () => {
      router.start("/route2/1?mode=dev", (_err, state) => {
        expect(state?.params).toEqual({ mode: "dev", id: "1" });

        router.navigate("route2", { id: "2" }, {}, (_err, state) => {
          expect(state?.path).toBe("/route2/2?mode=dev");
        });
      });
    });
  });

  describe("with an object", () => {
    beforeEach(() => {
      router.usePlugin(persistentParamsPlugin({ mode: "dev" }));
    });

    it("should persist specified parameters", () => {
      router.start();

      router.navigate("route1", { id: "1" }, {}, (_err, state) => {
        expect(state?.path).toBe("/route1/1?mode=dev");
      });
    });
  });
});
