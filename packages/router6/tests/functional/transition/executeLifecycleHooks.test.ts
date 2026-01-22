import { describe, it, expect, vi } from "vitest";

import { RouterError } from "router6";

import { executeLifecycleHooks } from "../../../modules/transition/executeLifecycleHooks";

import type {
  State,
  ActivationFn,
  RouterError as RouterErrorType,
  Params,
} from "router6-types";

describe("transition/executeLifecycleHooks", () => {
  const createState = (name: string, params: Params = {}): State => ({
    name,
    params,
    path: `/${name}`,
    meta: { id: 1, params: {}, options: {}, redirected: false },
  });

  describe("guard returning modified state (line 106)", () => {
    it("should merge state when guard returns different object with same route name", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const toState = createState("users", { id: "123" });
      const fromState = createState("home");

      let resultState: State | undefined;

      // Hook that returns a different state object with same route name
      // This triggers the branch at line 106: newState !== currentState && isState(newState)
      const modifyHook: ActivationFn = (currentState, _fromState, done) => {
        // Return a NEW state object (different reference) with same route name
        // but modified params/path to trigger the hasChanged warning
        const modifiedState: State = {
          ...currentState,
          params: { id: "456" }, // Different params
          path: "/users/456", // Different path
        };

        done(undefined, modifiedState);
      };

      const hooks = new Map<string, ActivationFn>([["users", modifyHook]]);

      executeLifecycleHooks(
        hooks,
        toState,
        fromState,
        ["users"],
        "CANNOT_ACTIVATE",
        () => false,
        (_error, state) => {
          resultState = state;
        },
      );

      // State should be merged (line 136)
      expect(resultState).toBeDefined();
      expect(resultState!.name).toBe("users");

      // Should log warning about state mutation (lines 129-133)
      expect(consoleSpy).toHaveBeenCalledWith(
        "router6:transition",
        "Warning: State mutated during transition",
        expect.any(Object),
      );

      consoleSpy.mockRestore();
    });

    it("should handle guard returning same-name state without changes (no warning)", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const toState = createState("users", { id: "123" });
      const fromState = createState("home");

      let resultState: State | undefined;

      // Hook that returns a state with same params and path (no hasChanged)
      const noChangeHook: ActivationFn = (currentState, _fromState, done) => {
        // Return a NEW object reference but with same params/path references
        const unchangedState: State = {
          ...currentState,
        };

        done(undefined, unchangedState);
      };

      const hooks = new Map<string, ActivationFn>([["users", noChangeHook]]);

      executeLifecycleHooks(
        hooks,
        toState,
        fromState,
        ["users"],
        "CANNOT_ACTIVATE",
        () => false,
        (_error, state) => {
          resultState = state;
        },
      );

      expect(resultState).toBeDefined();
      expect(resultState!.name).toBe("users");

      // No warning since params and path didn't change
      expect(consoleSpy).not.toHaveBeenCalledWith(
        "router6:transition",
        "Warning: State mutated during transition",
        expect.any(Object),
      );

      consoleSpy.mockRestore();
    });

    it("should reject when guard returns state with different route name", () => {
      const toState = createState("users");
      const fromState = createState("home");

      let resultError: RouterErrorType | undefined;

      // Hook that tries to redirect to different route (not allowed for guards)
      const redirectHook: ActivationFn = (_toState, _fromState, done) => {
        const redirectState: State = {
          name: "admin", // Different route name
          params: {},
          path: "/admin",
        };

        done(undefined, redirectState);
      };

      const hooks = new Map<string, ActivationFn>([["users", redirectHook]]);

      executeLifecycleHooks(
        hooks,
        toState,
        fromState,
        ["users"],
        "CANNOT_ACTIVATE",
        () => false,
        (error, _state) => {
          resultError = error;
        },
      );

      expect(resultError).toBeDefined();
      expect(resultError!.message).toContain("Guards cannot redirect");
    });

    it("should skip merge when guard returns exact same state object (line 106 false branch)", () => {
      const toState = createState("users", { id: "123" });
      const fromState = createState("home");

      let resultState: State | undefined;

      // Hook that returns the EXACT SAME state object (same reference)
      // This tests the branch where newState === currentState (line 106 condition is false)
      const sameStateHook: ActivationFn = (currentState, _fromState, done) => {
        // Return the same object reference - condition at line 106 is false
        done(undefined, currentState);
      };

      const hooks = new Map<string, ActivationFn>([["users", sameStateHook]]);

      executeLifecycleHooks(
        hooks,
        toState,
        fromState,
        ["users"],
        "CANNOT_ACTIVATE",
        () => false,
        (_error, state) => {
          resultState = state;
        },
      );

      // State should be the same object (not merged, just passed through)
      expect(resultState).toBe(toState);
      expect(resultState!.name).toBe("users");
    });

    it("should handle guard returning invalid state object (isState false)", () => {
      const toState = createState("users");
      const fromState = createState("home");

      let resultState: State | undefined;

      // Hook that returns an object that doesn't pass isState check
      // This tests the branch where isState(newState) is false (line 106 second condition)
      const invalidStateHook: ActivationFn = (_toState, _fromState, done) => {
        // Return an invalid state-like object (missing required fields)
        const invalidState = { name: "users" } as unknown as State;

        done(undefined, invalidState);
      };

      const hooks = new Map<string, ActivationFn>([
        ["users", invalidStateHook],
      ]);

      executeLifecycleHooks(
        hooks,
        toState,
        fromState,
        ["users"],
        "CANNOT_ACTIVATE",
        () => false,
        (_error, state) => {
          resultState = state;
        },
      );

      // Should continue with original state since newState is invalid
      expect(resultState).toBeDefined();
      expect(resultState!.name).toBe("users");
    });
  });

  describe("safeCallback error handling", () => {
    it("should catch and log error when callback throws", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const toState = createState("users");
      const fromState = createState("home");
      const hooks = new Map<string, ActivationFn>();

      // Callback that throws
      const throwingCallback = () => {
        throw new Error("Callback error");
      };

      // When no hooks to process, callback is called immediately
      executeLifecycleHooks(
        hooks,
        toState,
        fromState,
        [],
        "CANNOT_DEACTIVATE",
        () => false,
        throwingCallback as unknown as (
          error: RouterErrorType | undefined,
          state: State,
        ) => void,
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "router6:lifecycle",
        "Error in lifecycle callback:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it("should catch and log error when callback throws after processing hooks", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const toState = createState("users");
      const fromState = createState("home");

      // Hook that allows navigation
      const allowHook: ActivationFn = (_toState, _fromState, done) => {
        done();
      };

      const hooks = new Map<string, ActivationFn>([["users", allowHook]]);

      // Callback that throws
      const throwingCallback = () => {
        throw new Error("Callback error after hooks");
      };

      executeLifecycleHooks(
        hooks,
        toState,
        fromState,
        ["users"],
        "CANNOT_ACTIVATE",
        () => false,
        throwingCallback as unknown as (
          error: RouterErrorType | undefined,
          state: State,
        ) => void,
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "router6:lifecycle",
        "Error in lifecycle callback:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it("should catch and log error when callback throws on cancellation", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const toState = createState("users");
      const fromState = createState("home");

      // Hook that will be interrupted by cancellation
      const slowHook: ActivationFn = (_toState, _fromState, done) => {
        // Simulate async - done is called after isCancelled returns true
        setTimeout(() => {
          done();
        }, 0);
      };

      const hooks = new Map<string, ActivationFn>([["users", slowHook]]);

      let cancelled = false;

      // Callback that throws
      const throwingCallback = () => {
        throw new Error("Callback error on cancel");
      };

      executeLifecycleHooks(
        hooks,
        toState,
        fromState,
        ["users"],
        "CANNOT_ACTIVATE",
        () => cancelled,
        throwingCallback as unknown as (
          error: RouterErrorType | undefined,
          state: State,
        ) => void,
      );

      // Cancel before hook completes
      cancelled = true;

      // Wait for setTimeout to trigger
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 10);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "router6:lifecycle",
        "Error in lifecycle callback:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it("should catch and log error when callback throws on hook error", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const toState = createState("users");
      const fromState = createState("home");

      // Hook that rejects navigation
      const rejectHook: ActivationFn = (_toState, _fromState, done) => {
        done(new RouterError("CANNOT_ACTIVATE"));
      };

      const hooks = new Map<string, ActivationFn>([["users", rejectHook]]);

      // Callback that throws
      const throwingCallback = () => {
        throw new Error("Callback error on hook rejection");
      };

      executeLifecycleHooks(
        hooks,
        toState,
        fromState,
        ["users"],
        "CANNOT_ACTIVATE",
        () => false,
        throwingCallback as unknown as (
          error: RouterErrorType | undefined,
          state: State,
        ) => void,
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "router6:lifecycle",
        "Error in lifecycle callback:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });
});
