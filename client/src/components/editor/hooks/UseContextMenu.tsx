import {useState} from "react";
import {ViewportPoint, getViewportBounds} from "../Util";


interface UseContextMenuResult {
    isOpen: boolean;
    anchor: ViewportPoint;
    anchorAt: (baseAnchor: ViewportPoint, menu: HTMLElement) => void;
    close: () => void;
}

function useContextMenu() : UseContextMenuResult {
    const [isOpen, setIsOpen] = useState(false);
    const [anchor, setAnchor] = useState<ViewportPoint>({x: 0, y: 0});

    const anchorAt = (baseAnchor: ViewportPoint,  menu: HTMLElement) => {
        const vh = document.documentElement.clientHeight;
        // assumes that the menu appearing and dissappearing is controlled by menu.style.display
        const initialDisplay = menu.style.display;
        menu.style.display = "initial";
        const {height} = getViewportBounds(menu);
        menu.style.display = initialDisplay;
        if(baseAnchor.y + height > vh){
            baseAnchor.y -= height; 
        }
        setIsOpen(true);
        setAnchor(baseAnchor);
    }

    const close = () => {
        setIsOpen(false);
    }

    return {isOpen, anchor, anchorAt, close};
}

export default useContextMenu;