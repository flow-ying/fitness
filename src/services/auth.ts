import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type AuthUser = Pick<User, "id" | "email">;
export type AuthClient = SupabaseClient<Database>;

function toAuthUser(user: User | null): AuthUser | null {
  return user ? { id: user.id, email: user.email } : null;
}

export async function getCurrentUser(
  client: AuthClient,
): Promise<AuthUser | null> {
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  return toAuthUser(data.user);
}

export async function signInWithPassword(
  client: AuthClient,
  email: string,
  password: string,
): Promise<AuthUser> {
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  const user = toAuthUser(data.user);
  if (!user) throw new Error("登录成功但没有返回用户信息");
  return user;
}

export async function signUpWithPassword(
  client: AuthClient,
  email: string,
  password: string,
): Promise<AuthUser | null> {
  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return toAuthUser(data.user);
}

export async function signOut(client: AuthClient): Promise<void> {
  const { error } = await client.auth.signOut();
  if (error) throw error;
}
