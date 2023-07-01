import "./InviteDialogContent.css"
import toast from "react-hot-toast";
import { SUCCESS } from "../../notifications/Notification";

export async function copyInviteLink() {
    await navigator.clipboard.writeText(window.location.href);
    toast(`Invite link copied!`, SUCCESS as any);
};


export default function InviteDialogContent() {
    return (
        <>
            <h2>
                Invite your friends!
            </h2>
            <div className="invite-dialog-message">
                <span>
                    Have fun while reviewing each others code!
                </span>
                <span>
                    We encourage everyone to join a Discord call for extra banter! 😜
                </span>
            </div>
            <div className="invite-dialog-content-actions">
                <div className="invite-url">
                    <code>
                        {window.location.href}
                    </code>
                </div>
                <div>
                    <button onClick={copyInviteLink}>Copy</button>
                </div>
            </div>
        </>
    )
} 