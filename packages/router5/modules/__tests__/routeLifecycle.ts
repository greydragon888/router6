import { errorCodes } from "../";
import { createTestRouter, omitMeta } from "./helpers";
import type { Router } from "..";

let router: Router;

describe("core/route-lifecycle", () => {
  beforeEach(() => (router = createTestRouter().start()));
  afterEach(() => router.stop());

  it("should block navigation if a component refuses deactivation", () =>
    new Promise((done) => {
      router.navigate("users.list", () => {
        // Cannot deactivate
        router.canDeactivate("users.list", () => () => Promise.reject());
        router.navigate("users", (err) => {
          expect(err.code).toBe(errorCodes.CANNOT_DEACTIVATE);
          expect(err.segment).toBe("users.list");
          expect(omitMeta(router.getState())).toEqual({
            name: "users.list",
            params: {},
            path: "/users/list",
          });

          // Can deactivate
          router.canDeactivate("users.list", true);
          router.navigate("users", () => {
            expect(omitMeta(router.getState())).toEqual({
              name: "users",
              params: {},
              path: "/users",
            });
            // Auto clean up
            expect(router.getLifecycleFunctions()[0]["users.list"]).toBe(
              undefined,
            );

            done(null);
          });
        });
      });
    }));

  it("should register can deactivate status", () =>
    new Promise((done) => {
      router.navigate("users.list", () => {
        router.canDeactivate("users.list", false);
        router.navigate("users", (err) => {
          expect(err.code).toBe(errorCodes.CANNOT_DEACTIVATE);
          expect(err.segment).toBe("users.list");
          router.canDeactivate("users.list", true);
          router.navigate("users", (err) => {
            expect(err).toBe(null);

            done(null);
          });
        });
      });
    }));

  it("should block navigation if a route cannot be activated", () =>
    new Promise((done) => {
      router.navigate("home", () => {
        router.navigate("admin", (err) => {
          expect(err.code).toBe(errorCodes.CANNOT_ACTIVATE);
          expect(err.segment).toBe("admin");
          expect(router.isActive("home")).toBe(true);

          done(null);
        });
      });
    }));

  it("should force deactivation if specified as a transition option", () =>
    new Promise((done) => {
      router.navigate("orders.view", { id: "1" }, {}, () => {
        router.canDeactivate("orders.view", false);
        router.navigate("home", (err) => {
          expect(err.code).toBe(errorCodes.CANNOT_DEACTIVATE);
          router.navigate(
            "home",
            {},
            { forceDeactivate: true },
            (_err, state) => {
              expect(state.name).toBe("home");

              done(null);
            },
          );
        });
      });
    }));
});
