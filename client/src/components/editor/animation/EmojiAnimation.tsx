import { useRef, useEffect, useCallback } from "react";
import "./EmojiAnimation.css";

interface EmojiAnimationProps {
  count: number;
  createInitialEmoji: (boundingBox: BoundingBox) => EmojiSprite;
  updateEmoji: (emoji: EmojiSprite, boundingBox: BoundingBox) => EmojiSprite[];
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

export interface BoundingBox {
  topLeft: {
    x: number;
    y: number;
  };
  width: number;
  height: number;
}

function getEmojiTransform({ position, rotation }: EmojiSprite) {
  return `translate3d(${position.x}px, ${position.y}px, 0px) rotate(${rotation.tilt}rad)`;
}

function cloneEmoji(emoji: EmojiSprite) {
  return JSON.parse(JSON.stringify(emoji));
}

function getBoundingBox(element: HTMLElement) {
  const { x, y, width, height } = element.getBoundingClientRect();
  return {
    topLeft: {
      x,
      y,
    },
    width,
    height,
  };
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
    const boundingBox = getBoundingBox(showerGround);

    let currentEmojis: EmojiSprite[] = [];
    for (let i = 0; i < count; i++) {
      currentEmojis.push(createInitialEmoji(boundingBox));
    }

    const update = () => {
      currentEmojis = currentEmojis
        .map((emoji) => {
          return updateEmoji(emoji, boundingBox);
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
  zone: BoundingBox;
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

  const createInitialEmoji = useCallback((boundingBox: BoundingBox) => {
    const yOffset = zone.topLeft.y - boundingBox.topLeft.y;
    const xOffset = zone.topLeft.x - boundingBox.topLeft.x;

    const sizeOffset = BASE_DROP_SIZE / 2;
    const size =
      BASE_DROP_SIZE + Math.ceil(Math.random() * BASE_DROP_SIZE) - sizeOffset;

    const px = Math.ceil(Math.random() * (zone.width - size)) + xOffset;
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
        y: yOffset,
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
  }, []);

  const updateEmoji = useCallback(
    (emoji: EmojiSprite, boundingBox: BoundingBox) => {
      const bottomBoundary =
        zone.topLeft.y + zone.height - boundingBox.topLeft.y - emoji.size;

      const leftBoundary = zone.topLeft.x - boundingBox.topLeft.x;
      const rightBoundary =
        zone.topLeft.x + (zone.width - emoji.size) - boundingBox.topLeft.x;

      if (emoji.type === EmojiSpriteType.PIECE) {
        if (emoji.position.x <= leftBoundary || emoji.position.x >= rightBoundary) {
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

      const dx = emoji.velocity.x;
      newEmoji.position.x = Math.min(
        Math.max(newEmoji.position.x + dx, 0),
        rightBoundary
      );

      newEmoji.version++;

      const dy = emoji.velocity.y;
      newEmoji.position.y = Math.min(
        Math.max(newEmoji.position.y + dy, 0),
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
