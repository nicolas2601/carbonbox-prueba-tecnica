import { loadSettings } from "../config";
import { App } from "./App";

try {
  await new App(loadSettings()).start();
} catch (error) {
  console.error("The API failed to start", error);
  process.exit(1);
}
