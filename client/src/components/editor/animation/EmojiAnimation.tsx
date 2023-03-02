import { useRef, useEffect, useCallback } from "react";
import {
  anchorViewportBoundsRelativeTo,
  getViewportBounds,
  ViewportBounds,
} from "../Util";
import "./EmojiAnimation.css";

interface EmojiAnimationProps {
  count: number;
  createInitialEmoji: (animationContainerBounds: ViewportBounds) => EmojiSprite;
  updateEmoji: (
    emoji: EmojiSprite,
    animationContainerBounds: ViewportBounds
  ) => EmojiSprite[];
  onFinish: () => void;
}

enum EmojiSpriteType {
  WHOLE,
  PIECE,
}

interface EmojiSprite {
  version: number; // debugging
  emoji: string;
  type: EmojiSpriteType;
  size: number;
  position: {
    x: number;
    y: number;
  };
  velocity: {
    x: number;
    y: number;
  };
  acceleration: {
    y: number;
  };
  rotation: {
    tilt: number; //radians,
    speed: number; //radians
  };
  opacity: number;
}

function getEmojiTransform({ position, rotation }: EmojiSprite) {
  return `translate3d(${position.x}px, ${position.y}px, 0px) rotate(${rotation.tilt}rad)`;
}

function cloneEmoji(emoji: EmojiSprite) {
  return JSON.parse(JSON.stringify(emoji));
}

function EmojiAnimation({
  count,
  createInitialEmoji,
  updateEmoji,
  onFinish,
}: EmojiAnimationProps) {
  const emojiShower = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const showerGround = emojiShower.current as HTMLDivElement;
    const showerGroundBounds = getViewportBounds(showerGround);

    let currentEmojis: EmojiSprite[] = [];
    for (let i = 0; i < count; i++) {
      currentEmojis.push(createInitialEmoji(showerGroundBounds));
    }

    const update = () => {
      currentEmojis = currentEmojis
        .map((emoji) => {
          return updateEmoji(emoji, showerGroundBounds);
        })
        .flat();

      updateEmojisDisplay(currentEmojis, showerGround);
      if (currentEmojis.length === 0) {
        onFinish();
      } else {
        window.requestAnimationFrame(update);
      }
    };

    window.requestAnimationFrame(update);
  }, []);

  const updateEmojisDisplay = (
    emojiSprites: EmojiSprite[],
    showerGround: HTMLDivElement
  ) => {
    const elementsLength = showerGround.getElementsByClassName("emoji").length;
    const emojisLength = emojiSprites.length;

    for (let i = elementsLength; i < emojisLength; i++) {
      const element = document.createElement("span");
      element.className = "emoji";
      showerGround.insertBefore(
        element,
        showerGround.firstChild as HTMLElement
      );
    }

    for (let i = emojisLength; i < elementsLength; i++) {
      if (showerGround.getElementsByClassName("emoji").length > 0) {
        showerGround.removeChild(
          showerGround.getElementsByClassName("emoji").item(0) as Element
        );
      }
    }

    const elements = showerGround.getElementsByClassName("emoji");
    for (let i = 0; i < emojiSprites.length; i++) {
      const spriteEl = elements[i] as HTMLSpanElement;
      const { transform, fontSize, opacity } = getEmojiStyle(emojiSprites[i]);
      spriteEl.textContent = emojiSprites[i].emoji;
      spriteEl.style.fontSize = fontSize;
      spriteEl.style.transform = transform;
      spriteEl.style.opacity = opacity;
      showerGround.insertBefore(spriteEl, showerGround.firstChild);
    }
  };

  const getEmojiStyle = (emoji: EmojiSprite) => {
    return {
      transform: getEmojiTransform(emoji),
      fontSize: `${emoji.size}px`,
      opacity: `${emoji.opacity}%`,
    };
  };

  return <div className="emoji-shower" ref={emojiShower}></div>;
}

interface EmojiShowerProps {
  zone: ViewportBounds;
  emoji: string;
  count: number;
  onFinish: () => void;
}

function EmojiShower({ zone, emoji, count, onFinish }: EmojiShowerProps) {
  const BASE_DROP_SIZE = 28;
  const BASE_VELOCITY_Y = 0.3;
  const BASE_ACCELERATION_Y = 0.08;
  const BASE_PIECE_VELOCITY_Y = -5;
  const BASE_PIECE_VELOCITY_X = 0.3;
  const OPACITY_DRAIN = -1;

  const makePiecesFromWhole = (wholeSprite: EmojiSprite) => {
    const pieceVx = BASE_PIECE_VELOCITY_X + Math.random();
    const pieceVy = BASE_PIECE_VELOCITY_Y + (Math.random() * 2 - 1);
    const size = Math.ceil(wholeSprite.size / 2);

    const piece1 = {
      ...cloneEmoji(wholeSprite),
      type: EmojiSpriteType.PIECE,
      size,
    };
    piece1.position.y -= 1;
    piece1.velocity = { x: pieceVx, y: pieceVy };
    piece1.rotation = { tilt: 0.5, speed: 0.001 };

    const piece2 = cloneEmoji(piece1);
    piece2.velocity.x *= -1;
    piece2.rotation = { tilt: -0.5, speed: -0.001 };

    return [piece1, piece2];
  };

  const createInitialEmoji = useCallback(
    (animationContainerBounds: ViewportBounds) => {
      const animationBounds = anchorViewportBoundsRelativeTo(
        zone,
        animationContainerBounds
      );
      const sizeOffset = BASE_DROP_SIZE / 2;
      const size =
        BASE_DROP_SIZE + Math.ceil(Math.random() * BASE_DROP_SIZE) - sizeOffset;

      const px =
        Math.ceil(Math.random() * (zone.width - size)) +
        animationBounds.topLeft.x;
      const vy = BASE_VELOCITY_Y + Math.random() * 0.2;
      const ay = BASE_ACCELERATION_Y + Math.random() * 0.04;
      const tilt = Math.random() * 2;
      const rotationalSpeed = Math.random() * 0.01;

      return {
        version: 0,
        emoji,
        type: EmojiSpriteType.WHOLE,
        size,
        position: {
          x: px,
          y: animationBounds.topLeft.y,
        },
        velocity: {
          x: 0,
          y: vy,
        },
        acceleration: {
          y: ay,
        },
        rotation: {
          tilt: tilt, //radians,
          speed: rotationalSpeed, //radians
        },
        opacity: 100,
      };
    },
    []
  );

  const updateEmoji = useCallback(
    (emoji: EmojiSprite, animationContainerBounds: ViewportBounds) => {
      const animationBounds = anchorViewportBoundsRelativeTo(
        zone,
        animationContainerBounds
      );

      const bottomBoundary = animationBounds.bottomRight.y - emoji.size;

      const topBoundary = animationBounds.topLeft.y;

      const leftBoundary = animationBounds.topLeft.x;

      const rightBoundary = animationBounds.bottomRight.x - emoji.size;

      if (emoji.type === EmojiSpriteType.PIECE) {
        if (
          emoji.position.x <= leftBoundary ||
          emoji.position.x >= rightBoundary
        ) {
          return [];
        }
        if (emoji.position.y >= bottomBoundary) {
          return [];
        }
        if (emoji.opacity <= 0) {
          return [];
        }
      }

      if (emoji.type === EmojiSpriteType.WHOLE) {
        if (emoji.position.y >= bottomBoundary) {
          return makePiecesFromWhole(emoji);
        }
      }

      let newEmoji = cloneEmoji(emoji);
      newEmoji.velocity.y += emoji.acceleration.y;
      newEmoji.position.x = Math.min(
        Math.max(newEmoji.position.x + emoji.velocity.x, leftBoundary),
        rightBoundary
      );
      newEmoji.version++;
      newEmoji.position.y = Math.min(
        Math.max(newEmoji.position.y + emoji.velocity.y, topBoundary),
        bottomBoundary
      );
      newEmoji.rotation.tilt += emoji.rotation.speed;

      if (newEmoji.type === EmojiSpriteType.PIECE) {
        newEmoji.opacity += OPACITY_DRAIN;
      }
      return [newEmoji];
    },
    []
  );

  return (
    <EmojiAnimation
      count={count}
      updateEmoji={updateEmoji}
      createInitialEmoji={createInitialEmoji}
      onFinish={onFinish}
    />
  );
}

export default EmojiShower;
