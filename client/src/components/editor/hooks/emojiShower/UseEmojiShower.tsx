import { useReward } from "react-rewards";

function useEmojiShower() {
    const { reward: poopShower } = useReward('poopShower', 'emoji', { emoji: ["💩"], spread: 60, lifetime: 50 });
    const { reward: diamondShower } = useReward('diamondShower', 'emoji', { emoji: ["💎"], spread: 60, lifetime: 50 });

    return { poopShower, diamondShower }
}

export default useEmojiShower;