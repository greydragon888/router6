import { errorCodes } from "../";
import { createTestRouter, omitMeta } from "./helpers";
import type { Router } from "..";

let router: Router;

describe("core/route-lifecycle", () => {
  beforeEach(() => (router = createTestRouter().start()));

  afterEach(() => {
    router.stop();
  });

  it("should block navigation if a component refuses deactivation", () => {
    router.navigate("users.list", () => {
      // Cannot deactivate
      router.canDeactivate("users.list", () => () => Promise.reject());
      router.navigate("users", (err) => {
        expect((err as { code: string; segment: string }).code).toStrictEqual(
          errorCodes.CANNOT_DEACTIVATE,
        );
        expect(
          (err as { code: string; segment: string }).segment,
        ).toStrictEqual("users.list");
        expect(omitMeta(router.getState()!)).toStrictEqual({
          name: "users.list",
          params: {},
          path: "/users/list",
        });

        // Can deactivate
        router.canDeactivate("users.list", true);
        router.navigate("users", () => {
          expect(omitMeta(router.getState()!)).toStrictEqual({
            name: "users",
            params: {},
            path: "/users",
          });
          // Auto clean up
          expect(router.getLifecycleFunctions()[0]["users.list"]).toStrictEqual(
            undefined,
          );
        });
      });
    });
  });

  it("should register can deactivate status", () =>
    new Promise((done) => {
      router.navigate("users.list", () => {
        router.canDeactivate("users.list", false);
        router.navigate("users", (err) => {
          expect((err as { code: string; segment: string }).code).toStrictEqual(
            errorCodes.CANNOT_DEACTIVATE,
          );
          expect(
            (err as { code: string; segment: string }).segment,
          ).toStrictEqual("users.list");

          router.canDeactivate("users.list", true);
          router.navigate("users", (err) => {
            expect(err).toStrictEqual(null);

            done(null);
          });
        });
      });
    }));

  it("should block navigation if a route cannot be activated", () => {
    router.navigate("home", () => {
      router.navigate("admin", (err) => {
        expect((err as { code: string; segment: string }).code).toStrictEqual(
          errorCodes.CANNOT_ACTIVATE,
        );
        expect(
          (err as { code: string; segment: string }).segment,
        ).toStrictEqual("admin");
        expect(router.isActive("home")).toStrictEqual(true);
      });
    });
  });

  it("should force deactivation if specified as a transition option", () => {
    router.navigate("orders.view", { id: "1" }, {}, () => {
      router.canDeactivate("orders.view", false);
      router.navigate("home", (err) => {
        expect((err as { code: string; segment: string }).code).toStrictEqual(
          errorCodes.CANNOT_DEACTIVATE,
        );

        router.navigate(
          "home",
          {},
          { forceDeactivate: true },
          (_err, state) => {
            expect(state?.name).toStrictEqual("home");
          },
        );
      });
    });
  });
});
