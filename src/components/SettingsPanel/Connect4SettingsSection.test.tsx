import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";

import { Connect4SettingsSection } from "./index";
import { useConnect4Settings } from "@/lib/connect4/state/useConnect4Settings";

beforeEach(() => {
  useConnect4Settings.getState().resetSettings();
});

describe("Connect4SettingsSection — smoke render", () => {
  it("renders without crashing", () => {
    render(<Connect4SettingsSection />);
    expect(screen.getByText("Connect 4")).toBeInTheDocument();
  });

  it("renders Show last move toggle with default ON", () => {
    render(<Connect4SettingsSection />);
    const toggle = screen.getByRole("checkbox", { name: /show last move/i });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toBeChecked();
  });

  it("renders Allow undo toggle with default ON", () => {
    render(<Connect4SettingsSection />);
    const toggle = screen.getByRole("checkbox", { name: /allow undo/i });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toBeChecked();
  });

  it("renders Hints toggle with default ON", () => {
    render(<Connect4SettingsSection />);
    const toggle = screen.getByRole("checkbox", { name: /hints/i });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toBeChecked();
  });

  it("renders Auto-hint delay dropdown with default 30s selected", () => {
    render(<Connect4SettingsSection />);
    const select = screen.getByRole("combobox", { name: /auto-hint delay/i });
    expect(select).toBeInTheDocument();
    expect((select as HTMLSelectElement).value).toBe("30000");
  });

  it("renders Animation speed dropdown with default Normal (60ms) selected", () => {
    render(<Connect4SettingsSection />);
    const select = screen.getByRole("combobox", { name: /animation speed/i });
    expect(select).toBeInTheDocument();
    expect((select as HTMLSelectElement).value).toBe("60");
  });

  it("auto-hint delay dropdown has all four options", () => {
    render(<Connect4SettingsSection />);
    const select = screen.getByRole("combobox", { name: /auto-hint delay/i });
    const options = Array.from((select as HTMLSelectElement).options).map((o) => o.text);
    expect(options).toEqual(["Off", "15s", "30s", "60s"]);
  });

  it("animation speed dropdown has all four options", () => {
    render(<Connect4SettingsSection />);
    const select = screen.getByRole("combobox", { name: /animation speed/i });
    const options = Array.from((select as HTMLSelectElement).options).map((o) => o.text);
    expect(options).toEqual(["Off", "Slow", "Normal", "Fast"]);
  });
});
