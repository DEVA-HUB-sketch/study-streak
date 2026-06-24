"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Patches globalThis.fetch once on mount.
 * Any /api/* response with status 401 (except /api/auth/* routes)
 * immediately redirects the user to /login, preventing blank pages
 * when a JWT cookie has expired.
 */
export default function SessionGuard() {
  const router    = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    const original = globalThis.fetch;

    globalThis.fetch = async function guardedFetch(
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const res = await original.call(globalThis, input, init);

      if (res.status === 401) {
        const url =
          typeof input === "string"   ? input
          : input instanceof URL      ? input.href
          : (input as Request).url;

        const isOwnApi   = url.startsWith("/api/") || /https?:\/\/[^/]+\/api\//.test(url);
        const isAuthRoute = url.includes("/api/auth/login") || url.includes("/api/auth/register");

        if (isOwnApi && !isAuthRoute) {
          routerRef.current.replace("/login");
        }
      }

      return res;
    };

    return () => {
      globalThis.fetch = original;
    };
  }, []); // run once on mount — router accessed via ref

  return null;
}
