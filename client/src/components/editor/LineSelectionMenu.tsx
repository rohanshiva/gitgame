import { useState } from "react";
import * as Icon from "react-feather";
import { CommentType, AddComment, Lines } from "../../Interface";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import "./LineSelectionMenu.css";



interface LineSelectionMenuProps {
    open: boolean,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>,
    cancel: () => void,
    addComment: (comment: AddComment) => void,
    lines: Lines,
}

function LineSelectionMenu({ open, setOpen, cancel, addComment, lines }: LineSelectionMenuProps) {
    const [commentMessage, setCommentMessage] = useState<string>("");

    const onCancel = () => {
        cancel()
    }

    const onDiamond = () => {
        if(commentMessage !== ""){
            addComment({line_start: lines.start, line_end: lines.end, type: CommentType.DIAMOND, content: commentMessage})
        }
    }

    const onPoop = () => {
        if(commentMessage !== ""){
            addComment({line_start: lines.start, line_end: lines.end, type: CommentType.POOP, content: commentMessage})
        }
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
                    <textarea placeholder="say something here..." onChange={(e) => setCommentMessage(e.target.value)} value={commentMessage} maxLength={250} spellCheck={false} />
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