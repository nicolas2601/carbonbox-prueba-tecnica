import axios from "axios";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw/http";
import { expect, it, vi } from "vitest";
import { API_URL, server } from "./server";

it("Renders accessible controls and intercepts real Axios requests", async () => {
  const clicked = vi.fn();
  render(<button onClick={clicked}>Continue</button>);
  await userEvent.setup().click(screen.getByRole("button", { name: "Continue" }));
  expect(clicked).toHaveBeenCalledOnce();
  server.use(http.get(`${API_URL}/probe`, () => HttpResponse.json({ ready: true })));
  expect((await axios.get(`${API_URL}/probe`)).data).toEqual({ ready: true });
});
