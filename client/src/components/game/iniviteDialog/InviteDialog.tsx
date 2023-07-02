import "./InviteDialog.css"
import toast from "react-hot-toast";
import * as Icon from "react-feather";
import { SUCCESS } from "../../notifications/Notification";
import Dialog from "../../dialog/Dialog";

export async function copyInviteLink() {
    await navigator.clipboard.writeText(window.location.href);
    toast(`Invite link copied!`, SUCCESS as any);
};

interface InviteDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function InviteDialog({ isOpen, onClose }: InviteDialogProps) {
    return (
        <Dialog isOpen={isOpen} onClose={onClose}>
            <>
                <div className="dialog-header">
                    <h2>
                        Invite your friends!
                    </h2>
                    <div className="dialog-close">
                        <Icon.X size={16} onClick={onClose} />
                    </div>
                </div>
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
        </Dialog>
    )
} 