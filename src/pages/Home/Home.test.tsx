import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vite-plus/test";

import { HomePage } from "@/pages/Home";

describe("HomePage", () => {
  it("renders title", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /home/i })).toBeInTheDocument();
  });
});
