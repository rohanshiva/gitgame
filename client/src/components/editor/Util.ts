export interface ViewportPoint {
  x: number;
  y: number;
}

export interface ViewportBounds {
  topLeft: ViewportPoint;
  bottomRight: ViewportPoint;
  width: number;
  height: number;
}

/*
todo(Ramko9999): Add tests for the below functions
*/

export function getViewportBounds(element: HTMLElement): ViewportBounds {
  const { x, y, width, height } = element.getBoundingClientRect();
  return {
    topLeft: { x, y },
    bottomRight: {
      x: x + width,
      y: y + height,
    },
    width,
    height,
  };
}

export function anchorViewportBoundsRelativeTo(
  bounds: ViewportBounds,
  anchor: ViewportBounds
): ViewportBounds {
  return {
    topLeft: {
      x: bounds.topLeft.x - anchor.topLeft.x,
      y: bounds.topLeft.y - anchor.topLeft.y,
    },
    bottomRight: {
      x: bounds.bottomRight.x - anchor.topLeft.x,
      y: bounds.bottomRight.y - anchor.topLeft.y,
    },
    width: bounds.width,
    height: bounds.height,
  };
}

export function mergeViewportBounds(
  bounds1: ViewportBounds,
  bounds2: ViewportBounds
) {
  const topLeft = {
    x: Math.min(bounds1.topLeft.x, bounds2.topLeft.x),
    y: Math.min(bounds1.topLeft.y, bounds2.topLeft.y),
  };

  const bottomRight = {
    x: Math.max(bounds1.bottomRight.x, bounds2.bottomRight.x),
    y: Math.max(bounds1.bottomRight.y, bounds2.bottomRight.y),
  };

  return {
    topLeft,
    bottomRight,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  };
}

/*
Computes the minimum amount to scroll in the Y axis to display the scrollTarget 
*/
export function computeLazyScrollYAxisOptions(
  currentViewport: ViewportBounds,
  scrollTarget: ViewportBounds,
  maxScrollPadding: number
): ScrollToOptions {
  const scrollPadding = Math.min(
    Math.max(Math.floor((currentViewport.height - scrollTarget.height) / 2), 0),
    maxScrollPadding
  );

  const desiredViewportYBounds = {
    start: currentViewport.topLeft.y + scrollPadding,
    end: currentViewport.bottomRight.y - scrollPadding,
  };

  const isTargetBoundWithinDesiredView =
    desiredViewportYBounds.start <= scrollTarget.topLeft.y &&
    desiredViewportYBounds.end >= scrollTarget.bottomRight.y;

  if (!isTargetBoundWithinDesiredView) {
    if (
      scrollTarget.topLeft.y < desiredViewportYBounds.start ||
      scrollTarget.height >= currentViewport.height
    ) {
      return {
        top: scrollTarget.topLeft.y - desiredViewportYBounds.start,
        behavior: "smooth",
      };
    } else {
      return {
        top: scrollTarget.bottomRight.y - desiredViewportYBounds.end,
        behavior: "smooth",
      };
    }
  }

  // no need to scroll since the scrollTarget is already within our desired viewport Y range
  return {};
}
