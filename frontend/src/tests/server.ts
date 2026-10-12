import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw/http";

export const server = setupServer(http.get("http://localhost:3001/health/ready", () => HttpResponse.json({ status: "ready" })));
export const API_URL = "http://localhost:3001/api/v1";
