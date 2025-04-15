import { useContext } from "react";
import { RouterContext } from "../context";
import { Router } from "router5";

export const useRouter = (): Router => {
  return useContext(RouterContext);
};
