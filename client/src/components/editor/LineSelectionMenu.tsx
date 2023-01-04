import { useState } from "react";
import * as Icon from "react-feather";
import { CommentType, Comment, Lines } from "../../interfaces/Comment";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import "./LineSelectionMenu.css";



interface ILineSelectionMenuProps {
    open: boolean,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>,
    cancel: () => void,
    addComment: (comment: Comment) => void,
    lines: Lines,
}

function LineSelectionMenu({ open, setOpen, cancel, addComment, lines }: ILineSelectionMenuProps) {
    const [commentMessage, setCommentMessage] = useState<string>("");

    const onCancel = () => {
        cancel()
    }

    const onDiamond = () => {
        const comment = { lines, commentType: CommentType.DIAMOND, ...(commentMessage !== "" && { message: commentMessage }) }
        addComment(comment)
    }

    const onPoop = () => {
        const comment = { lines, commentType: CommentType.POOP, ...(commentMessage !== "" && { message: commentMessage }) }
        addComment(comment)
    }

    return (
        <Popover open={open} onOpenChange={setOpen} placement={'bottom-start'}>
            <PopoverTrigger className="popover-trigger" onClick={() => setOpen((v) => !v)}>
                <Icon.MoreHorizontal size={16} />
            </PopoverTrigger>
            <PopoverContent className="popover">
                <div className="add-comment-container">
                    <span className="popover-header">
                        Let them know!
                    </span>
                    <textarea placeholder="say something here...(optional)" onChange={(e) => setCommentMessage(e.target.value)} value={commentMessage} maxLength={250} spellCheck={false} />
                    <div className="add-comments-buttons">
                        <span className="add-comment-button" onClick={onCancel}>
                            ❌
                        </span>
                        <span className="add-comment-button" onClick={onDiamond}>
                            💎
                        </span>
                        <span className="add-comment-button" onClick={onPoop} id="poop-button">
                            💩
                        </span>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default LineSelectionMenu;