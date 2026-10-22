import { config } from "zod";

const z = { config };

export function configureZod() {
  z.config({ jitless: true });
}

configureZod();
