import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 30,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;
let browserRouter: ReturnType<typeof createRouter> | undefined;

export const getRouter = () => {
  const queryClient =
    typeof window === "undefined"
      ? createQueryClient()
      : (browserQueryClient ??= createQueryClient());

  if (typeof window !== "undefined" && browserRouter) {
    return browserRouter;
  }

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  if (typeof window !== "undefined") {
    browserRouter = router;
  }

  return router;
};
