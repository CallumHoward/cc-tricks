import { createFileRoute } from "@tanstack/react-router";

import { CharacterSheet } from "#/talk/mascot/sheet";

export const Route = createFileRoute("/character")({
  component: CharacterSheet,
});
