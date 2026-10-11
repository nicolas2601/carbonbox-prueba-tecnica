import { setupServer } from "msw/node";

export const server = setupServer();
export const API_URL = "http://localhost:3001/api/v1";
