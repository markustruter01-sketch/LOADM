import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { PublicUser } from "@shared/schema";
import { ROLE_CAPABILITIES, roleHas, type Capability, type Role } from "@shared/constants";
import { getStoredRole, setStoredRole, post, get } from "./api";
import { keys } from "./keys";

/**
 * The persona context replaces authentication. The visitor's chosen role is
 * stored locally and sent with every request; the server resolves it to the
 * seeded persona user. `user` is null until a role is chosen.
 */

interface MeResponse {
  role: Role | null;
  user: PublicUser | null;
  capabilities: readonly Capability[];
}

interface PersonaContextValue {
  /** Resolved persona; null until a role is chosen or while loading. */
  user: PublicUser | null;
  role: Role | null;
  isLoading: boolean;
  /** True when the server has confirmed a persona. */
  isReady: boolean;
  can: (capability: Capability) => boolean;
  chooseRole: (role: Role) => Promise<void>;
  leave: () => Promise<void>;
}

const PersonaContext = createContext<PersonaContextValue | null>(null);

export function PersonaProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const stored = getStoredRole();

  const me = useQuery({
    queryKey: keys.demo.me,
    queryFn: () => get<MeResponse>("/api/demo/me"),
    staleTime: 60_000,
    enabled: stored !== null,
  });

  // If the server says there is no persona but we have a stored role (e.g.
  // after a demo reset the cookie is still fine), nothing to do: the header
  // carries the role. If the stored role is invalid, clear it.
  useEffect(() => {
    if (me.data && me.data.role === null && stored) setStoredRole(null);
  }, [me.data, stored]);

  const chooseRole = useCallback(
    async (role: Role) => {
      setStoredRole(role);
      const res = await post<MeResponse>("/api/demo/role", { role });
      qc.setQueryData(keys.demo.me, res);
      await qc.invalidateQueries();
    },
    [qc],
  );

  const leave = useCallback(async () => {
    await post("/api/demo/leave");
    setStoredRole(null);
    qc.clear();
  }, [qc]);

  const value = useMemo<PersonaContextValue>(() => {
    const role = me.data?.role ?? (stored && !me.data ? stored : null);
    return {
      user: me.data?.user ?? null,
      role,
      isLoading: stored !== null && me.isLoading,
      isReady: !!me.data?.user,
      can: (cap) => (role ? roleHas(role, cap) : false),
      chooseRole,
      leave,
    };
  }, [me.data, me.isLoading, stored, chooseRole, leave]);

  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>;
}

export function usePersona(): PersonaContextValue {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error("usePersona must be used inside PersonaProvider");
  return ctx;
}

/** Convenience: the current user, throwing if used outside a chosen persona. */
export function useCurrentUser(): PublicUser {
  const { user } = usePersona();
  if (!user) throw new Error("No persona selected");
  return user;
}

export { ROLE_CAPABILITIES };
