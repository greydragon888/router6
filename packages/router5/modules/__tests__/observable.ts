import { createTestRouter } from "./helpers";
import type { Router, Subscription } from "..";

let router: Router;

describe("core/observable", () => {
  beforeEach(() => {
    router = createTestRouter().start();
  });

  afterEach(() => {
    router.stop();
  });

  it("should accept a listener function", () => {
    const unsubscribe = router.subscribe(() => undefined);

    expect(typeof unsubscribe).toStrictEqual("function");
  });

  it("should accept a listener object", () => {
    const subscription = router.subscribe({
      next: () => Promise.resolve(undefined),
    }) as Subscription;

    expect(typeof subscription.unsubscribe).toStrictEqual("function");
  });
});
