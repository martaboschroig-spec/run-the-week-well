import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MagicLinkAuth } from "@/components/app/MagicLinkAuth";

const { send } = vi.hoisted(() => ({ send: vi.fn().mockResolvedValue({ error: null }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { signInWithOtp: send } } }));

describe("Email link recovery", () => {
  it("allows resending and correcting an email without restarting signup", async () => {
    render(<MagicLinkAuth returnTo="/signup" />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "first@example.com" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole("button")).not.toBeDisabled());
    fireEvent.submit(input.closest("form") as HTMLFormElement);
    await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByRole("button")).not.toBeDisabled());
    fireEvent.change(input, { target: { value: "corrected@example.com" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);
    await waitFor(() => expect(send).toHaveBeenLastCalledWith({
      email: "corrected@example.com",
      options: { emailRedirectTo: window.location.origin + "/signup" },
    }));
  });
});