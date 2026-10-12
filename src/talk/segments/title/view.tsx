import { HomeRest } from "#/talk/segments/shared/home";

import { ColdOpen } from "./cold-open";
import { Win } from "./lib";
import { T } from "./tracks";

/** Title & spoiler: the million-token cold open, the ✳ sun over the road, the bone spoiler. */
export default function TitleSegment() {
  return (
    <>
      <Win from={-1} to={T.homeAt}>
        <ColdOpen />
      </Win>
      <HomeRest pile={0} from={T.homeAt} to={T.end} />
    </>
  );
}
