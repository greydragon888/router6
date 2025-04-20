import { useContext } from "react";
import { RouterContext } from "../context";
import { Router } from "router5";

export const useRouter = (): Router => {
  const router = useContext(RouterContext);

  if (!router) {
    throw new Error("useRouter must be used within a RouterProvider");
  }

  return router;
};
