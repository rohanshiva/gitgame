import { useReward } from "react-rewards";




function useEmojiShower(onAnimationComplete: () => void) {
    const { reward: poopShower, isAnimating: isPoopAnimating } = useReward('poopShower', 'emoji', { emoji: ["💩"], spread: 60, lifetime: 50, onAnimationComplete: onAnimationComplete });
    const { reward: diamondShower, isAnimating: isDiamondAnimating } = useReward('diamondShower', 'emoji', { emoji: ["💎"], spread: 60, lifetime: 50, onAnimationComplete: onAnimationComplete });

    return { poopShower, isPoopAnimating, diamondShower, isDiamondAnimating }
}

export default useEmojiShower;