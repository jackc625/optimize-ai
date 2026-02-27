import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import type { User } from "@supabase/supabase-js";

/**
 * useUser hook
 * - `user`: the currently authenticated Supabase user (or null)
 * - `loading`: true while retrieving the session; false afterward
 *
 * Side effects:
 * - Sets/clears the `sb-authed=true` cookie used by middleware for routing
 * - Shows a toast and redirects to /auth/login when a session expires mid-use
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<User | null>(null);
  const router = useRouter();

  // Keep ref in sync with state so the onAuthStateChange closure has current value
  const setUserBoth = (u: User | null) => {
    userRef.current = u;
    setUser(u);
  };

  useEffect(() => {
    // 1) On mount, check existing session and set cookie if authenticated
    supabase.auth.getUser().then(({ data }) => {
      setUserBoth(data.user);
      setLoading(false);
      if (data.user) {
        document.cookie = "sb-authed=true; path=/; SameSite=Lax";
      }
    });

    // 2) Listen for login/logout/expiry events
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const hadUser = !!userRef.current;
        setUserBoth(session?.user ?? null);

        if (session?.user) {
          document.cookie = "sb-authed=true; path=/; SameSite=Lax";
        } else {
          document.cookie =
            "sb-authed=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          if (hadUser) {
            // Session expired mid-use (user was logged in, now isn't)
            toast("Your session expired. Please sign in again.");
            router.push("/auth/login");
          }
        }
      }
    );

    // 3) Cleanup subscription on unmount
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  return { user, loading };
}
