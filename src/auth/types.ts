export type AuthRole = "authenticated" | "anon";

export type AuthUser = {
  id: string;
  email?: string;
  role?: AuthRole;
};
