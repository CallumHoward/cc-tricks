import type { ComponentProps } from "react";

import { Ticket } from "#/talk/kit/motion/ticket";

/** Clay ring round the punch so it reads on ivory as well as on the dark bed. */
const HOLE = { boxShadow: "inset 0 3px 0 rgb(0 0 0 / 25%), 0 0 0 3px var(--clay)" };

/** The kit Ticket tuned for the offers wall: a narrow stub and a clay-ringed punch. */
export function OfferTicket(props: ComponentProps<typeof Ticket>) {
  return (
    <Ticket
      stubWidth={120}
      punchY={0.24}
      padding="34px 28px"
      stubPadding={0}
      holeStyle={HOLE}
      {...props}
    />
  );
}
