import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

import "./Dialog.css";


interface UseDialogResult {
    isOpen: boolean;
    close: () => void;
    open: () => void;
}

export function useDialog(): UseDialogResult {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const open = () => {
        setIsOpen(true);
    }

    const close = () => {
        setIsOpen(false);
    };

    return { isOpen, open, close };
}


interface DialogProps {
    isOpen: boolean;
    onClose?: () => void;
    children: ReactNode;
}

function Dialog({ isOpen, onClose, children }: DialogProps) {

    const dialogRef = useRef<HTMLDialogElement>(null);

    const handleOutsideClick = useCallback(
        (event: MouseEvent) => {
            if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
                if (onClose) {
                    onClose();
                }
            }
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("mousedown", handleOutsideClick);
            document.body.classList.add("dialog-open");
        } else {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.body.classList.remove("dialog-open");
        }

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.body.classList.remove("dialog-open");
        };
    }, [isOpen]);

    return (
        <>
            {isOpen && (
                <>
                    <div className="dialog-overlay" />
                    <dialog open={isOpen} ref={dialogRef}>
                        {children}
                    </dialog>
                </>
            )}

        </>
    );
}

export default Dialog;
