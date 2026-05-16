import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";

import { DotsSettingsSection } from "./index";
import { useDotsSettings } from "@/lib/dotsAndBoxes/state/useDotsSettings";

beforeEach(() => {
  useDotsSettings.getState().resetSettings();
});

describe("DotsSettingsSection — smoke render", () => {
  it("renders without crashing", () => {
    render(<DotsSettingsSection />);
    expect(screen.getByText("Dots & Boxes")).toBeInTheDocument();
  });

  it("renders Show last move toggle with default ON", () => {
    render(<DotsSettingsSection />);
    const toggle = screen.getByRole("checkbox", { name: /show last move/i });
    expect(toggle).toBeChecked();
  });

  it("renders Allow undo toggle with default ON", () => {
    render(<DotsSettingsSection />);
    const toggle = screen.getByRole("checkbox", { name: /allow undo/i });
    expect(toggle).toBeChecked();
  });

  it("renders Hints toggle with default ON", () => {
    render(<DotsSettingsSection />);
    const toggle = screen.getByRole("checkbox", { name: /hints/i });
    expect(toggle).toBeChecked();
  });

  it("renders Auto-hint delay dropdown with default 30s selected", () => {
    render(<DotsSettingsSection />);
    const select = screen.getByRole("combobox", { name: /auto-hint delay/i });
    expect((select as HTMLSelectElement).value).toBe("30000");
  });

  it("auto-hint delay dropdown has all four options", () => {
    render(<DotsSettingsSection />);
    const select = screen.getByRole("combobox", { name: /auto-hint delay/i });
    const options = Array.from((select as HTMLSelectElement).options).map((o) => o.text);
    expect(options).toEqual(["Off", "15s", "30s", "60s"]);
  });

  it("renders Default size with 5×5 selected by default", () => {
    render(<DotsSettingsSection />);
    expect(screen.getByRole("button", { name: "5×5" })).toBeInTheDocument();
  });
});
