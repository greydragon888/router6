import { createTestRouter } from "./helpers";
import type { Router, Subscription } from "..";

let router: Router;

describe("core/observable", function () {
  beforeEach(() => {
    router = createTestRouter().start();
  });
  afterEach(() => {
    router.stop();
  });

  it("should accept a listener function", () => {
    const unsubscribe = router.subscribe(() => {});

    expect(typeof unsubscribe).toBe("function");
  });

  it("should accept a listener object", () => {
    const subscription = router.subscribe({
      next: async () => undefined,
    }) as Subscription;

    expect(typeof subscription.unsubscribe).toBe("function");
  });
});
