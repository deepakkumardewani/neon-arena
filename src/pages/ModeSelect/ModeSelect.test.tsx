import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vite-plus/test";

import { ModeSelectPage } from "@/pages/ModeSelect";

describe("ModeSelectPage", () => {
  it("renders title", () => {
    render(
      <MemoryRouter>
        <ModeSelectPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /mode select/i })).toBeInTheDocument();
  });
});
