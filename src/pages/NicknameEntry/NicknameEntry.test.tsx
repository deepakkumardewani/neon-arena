import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vite-plus/test";

import { NicknameEntryPage } from "@/pages/NicknameEntry";

describe("NicknameEntryPage", () => {
  it("renders title", () => {
    render(
      <MemoryRouter>
        <NicknameEntryPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /nickname/i })).toBeInTheDocument();
  });
});
