import { describe, expect, it, vi } from "vitest";
import { signInWithPassword, signUpWithPassword, signOut } from "./auth";

function clientMock() {
  const auth = {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  };
  return { client: { auth } as never, auth };
}

describe("auth service", () => {
  it("trims the email before signing in and returns the session user", async () => {
    const mock = clientMock();
    mock.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "user-1", email: "a@example.com" } },
      error: null,
    });

    await expect(
      signInWithPassword(mock.client, "  a@example.com ", "password"),
    ).resolves.toEqual({ id: "user-1", email: "a@example.com" });
    expect(mock.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "a@example.com",
      password: "password",
    });
  });

  it("supports sign-up confirmation where no session user is returned", async () => {
    const mock = clientMock();
    mock.auth.signUp.mockResolvedValue({ data: { user: null }, error: null });

    await expect(
      signUpWithPassword(mock.client, "a@example.com", "password"),
    ).resolves.toBeNull();
  });

  it("propagates sign-out failures to the UI boundary", async () => {
    const mock = clientMock();
    const error = new Error("network");
    mock.auth.signOut.mockResolvedValue({ error });

    await expect(signOut(mock.client)).rejects.toBe(error);
  });
});
