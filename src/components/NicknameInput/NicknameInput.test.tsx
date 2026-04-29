import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vite-plus/test";

import { NicknameInput } from "@/components/NicknameInput";
import {
  createGuestNickname,
  isNicknameValid,
  validateNickname,
} from "@/components/NicknameInput/nicknameRules";

describe("nicknameRules", () => {
  it("rejects fewer than 2 characters", () => {
    expect(validateNickname("a")).not.toBeNull();
    expect(isNicknameValid("a")).toBe(false);
  });

  it("rejects more than 24 characters", () => {
    expect(validateNickname("abcdefghijklmnopqrstuvwxy")).not.toBeNull();
    expect(isNicknameValid("abcdefghijklmnopqrstuvwxy")).toBe(false);
  });

  it("rejects spaces", () => {
    expect(validateNickname("a b")).not.toBeNull();
    expect(isNicknameValid("a b")).toBe(false);
  });

  it("rejects specials outside alnum underscore", () => {
    expect(validateNickname("ab-cd")).not.toBeNull();
    expect(validateNickname("你好")).not.toBeNull();
    expect(isNicknameValid("ab!")).toBe(false);
  });

  it("accepts valid nicknames", () => {
    expect(validateNickname("ab")).toBeNull();
    expect(validateNickname("Player_01")).toBeNull();
    expect(validateNickname("Guest_1234")).toBeNull();
    expect(isNicknameValid("valid_name")).toBe(true);
  });

  it("createGuestNickname matches Guest_ + 4 digits", () => {
    expect(createGuestNickname()).toMatch(/^Guest_\d{4}$/);
  });
});

function ControlledHarness(props: { readonly initial: string }) {
  const [value, setValue] = useState(props.initial);
  return <NicknameInput id="t-nick" label="Nickname" value={value} onValueChange={setValue} />;
}

describe("NicknameInput", () => {
  it("shows real-time validation for invalid input", async () => {
    const user = userEvent.setup();
    render(<ControlledHarness initial="ab" />);
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "x");
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("clears error when input becomes valid", async () => {
    const user = userEvent.setup();
    render(<ControlledHarness initial="x" />);
    const input = screen.getByRole("textbox");
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await user.type(input, "y");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows character counter when focused", async () => {
    const user = userEvent.setup();
    render(<ControlledHarness initial="ab" />);
    const input = screen.getByRole("textbox");
    expect(screen.queryByText(/\d+\s*\/\s*24/)).not.toBeInTheDocument();
    await user.click(input);
    expect(screen.getByText(/^2\s*\/\s*24$/)).toBeInTheDocument();
  });
});
