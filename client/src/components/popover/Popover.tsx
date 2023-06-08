import { ReactNode, useState, CSSProperties } from "react";
import { ViewportPoint, getViewportBounds } from "../editor/Util";
import { useRef, useEffect } from "react";

type Anchor = ViewportPoint | null;

interface UsePopoverResult {
  anchor: Anchor;
  anchorAt: (baseAnchor: ViewportPoint) => void;
  close: () => void;
}

export function usePopover(): UsePopoverResult {
  const [anchor, setAnchor] = useState<Anchor>(null);

  const anchorAt = (baseAnchor: ViewportPoint) => {
    setAnchor(baseAnchor);
  };

  const close = () => {
    setAnchor(null);
  };

  return { anchor, anchorAt, close };
}

interface Props {
  baseAnchor: Anchor;
  children: ReactNode;
}

function adjustAnchorToFit(
  anchorPoint: ViewportPoint,
  popover: HTMLDivElement
): ViewportPoint {
  let { x, y } = anchorPoint;
  const vh = document.documentElement.clientHeight;
  const vw = document.documentElement.clientWidth;
  const { height, width } = getViewportBounds(popover);
  if (y + height > vh) {
    y -= height;
  }
  if (x + width > vw) {
    x -= width;
  }
  return { x, y };
}

function Popover({ baseAnchor, children }: Props) {
  const [adjustedAnchor, setAdjustedAnchor] = useState<Anchor>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (baseAnchor != null) {
      setAdjustedAnchor(
        adjustAnchorToFit(baseAnchor, ref.current as HTMLDivElement)
      );
    } else {
      setAdjustedAnchor(null);
    }
  }, [baseAnchor]);

  let style: CSSProperties = { visibility: "hidden" };
  if (adjustedAnchor != null) {
    style = {
      visibility: "initial",
      top: adjustedAnchor.y,
      left: adjustedAnchor.x,
    };
  }

  return (
    <div
      ref={ref}
      style={style}
      className="context-menu"
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </div>
  );
}

export default Popover;
