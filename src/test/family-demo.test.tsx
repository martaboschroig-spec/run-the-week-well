import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FamilyDemo from "@/components/app/FamilyDemo";

describe("Local family demo", () => {
  it("keeps Mom responsible while Grandma's answer is pending", () => {
    render(<FamilyDemo />);
    fireEvent.click(screen.getByRole("button", { name: /Ask Grandma/ }));
    expect(screen.getByText("Mom", { selector: "b" })).toBeInTheDocument();
    expect(screen.queryByText("Grandma", { selector: "b" })).not.toBeInTheDocument();
  });

  it("moves pickup only after acceptance and can restore the sample", () => {
    render(<FamilyDemo />);
    fireEvent.click(screen.getByRole("button", { name: /Ask Grandma/ }));
    fireEvent.click(screen.getByRole("button", { name: /Accept as Grandma/ }));
    expect(screen.getByText("Grandma", { selector: "b" })).toBeInTheDocument();
    expect(screen.queryByText("Mom", { selector: "b" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Restart demo" }));
    expect(screen.getByText("Mom", { selector: "b" })).toBeInTheDocument();
  });
});