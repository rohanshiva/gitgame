import { useState } from "react";
import "./FeedbackCreationMenu.css";

interface FeedbackCreationMenuProps {
    onCancel: () => void;
}

function FeedbackCreationMenu({
    onCancel
}: FeedbackCreationMenuProps) {
    const [feedbackMessage, setFeedbackMessage] = useState<string>("");
    const [includeScreenshot, setIncludeScreenshot] = useState(false);

    const clear = () => {
        setFeedbackMessage("");
    };

    const takeScreenshot = async () => {

        // Tried to do this but ran into some Type Error
        // Create a canvas element
        // const canvas = document.createElement('canvas') as HTMLCanvasElement;
        // const context = canvas.getContext('2d');

        // // Set the canvas dimensions to the page dimensions
        // canvas.width = window.innerWidth;
        // canvas.height = window.innerHeight;

        // // Draw the current page content onto the canvas
        // context?.drawImage(
        //     (window as any).document.documentElement,
        //     0,
        //     0,
        //     window.innerWidth,
        //     window.innerHeight
        // );

        // // Get the data URL of the canvas image
        // const dataURL = canvas.toDataURL('image/png');

        // // Perform any necessary actions with the dataURL (e.g., display or download)
        // console.log(dataURL);
    }

    const submit = async () => {
        if (feedbackMessage.trim() !== "") {
            // todo: make API call to send feedback
            if (includeScreenshot) {
                await takeScreenshot();
            }
            console.log(feedbackMessage);
            clear();
        }
    };

    return (
        <>
            <div className="context-menu-container">
                <div className="context-menu-content">
                    <span className="context-menu-header">Please provide any feedback!</span>
                    <textarea
                        placeholder="...."
                        onChange={(e) => setFeedbackMessage(e.target.value)}
                        value={feedbackMessage}
                        maxLength={250}
                        spellCheck={false}
                    />
                    <div className="feedback-ss-consent-container">
                        <label>
                            <input type="checkbox" checked={includeScreenshot}
                                onChange={() => setIncludeScreenshot(!includeScreenshot)} />
                            Include Page Screenshot
                        </label>
                    </div>

                </div>

                <div className="context-menu-buttons">
                    <span className="context-menu-button" onClick={onCancel}>
                        ❌
                    </span>
                    <button
                        className="context-menu-button"
                        onClick={() => submit()}
                    >
                        Send
                    </button>
                </div>
            </div>
        </>
    );
}

export default FeedbackCreationMenu;
