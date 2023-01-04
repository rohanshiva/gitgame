import config from "../../config";
import { Comment } from "../../interfaces/Comment";
import "./Comments.css"

interface ICommentsProps {
    comments: Comment[]
}

function Comments({ comments }: ICommentsProps) {
    console.log(comments)
    return (
        <div className="comments-container">
            <div className="comments-container-header">
                Look who 💩 on your code! 😈🙊
            </div>
            <div className="comments-container-content">
                <div className="comments-section">
                    <div className="comments-section-header">
                        <code>
                            L5 - L7
                        </code>
                        <abbr title="ramko999, sponge, tanti">
                            <span className="emoji-reactions">
                                💩 8
                            </span>
                        </abbr>
                    </div>
                    <div className="comments-section-content">
                        <div className="player-comment">
                            <div className="player-comment-header">

                                <img alt={`https://github.com/${'rohanshiva'}`}
                                    className="player-comment-avatar"
                                    src={`${config.githubAvatarUri}${'rohanshiva'}`} />
                                <div>rohanshiva</div>

                            </div>
                            <div className="player-comment-content">
                                💀
                            </div>
                        </div>
                        <div className="player-comment">
                            <div className="player-comment-header">

                                <img alt={`https://github.com/${'ramko9999'}`}
                                    className="player-comment-avatar"
                                    src={`${config.githubAvatarUri}${'ramko9999'}`} />
                                <div>ramko9999</div>

                            </div>
                            <div className="player-comment-content">
                                Wtf is this???!!
                            </div>
                        </div>
                    </div>
                </div>
                <div className="comments-section">
                    <div className="comments-section-header">
                        <code>
                            L5 - L9
                        </code>
                        <abbr title="ramko999, sponge, tanti">
                            <span className="emoji-reactions">
                                💩 2
                            </span>
                        </abbr>
                    </div>
                    <div className="comments-section-content">
                        <div className="player-comment">
                            <div className="player-comment-header">

                                <img alt={`https://github.com/${'rohanshiva'}`}
                                    className="player-comment-avatar"
                                    src={`${config.githubAvatarUri}${'rohanshiva'}`} />
                                <div>rohanshiva</div>

                            </div>
                            <div className="player-comment-content">
                                Please don't do this 🙏🏿
                            </div>
                        </div>
                        <div className="player-comment">
                            <div className="player-comment-header">

                                <img alt={`https://github.com/${'ramko9999'}`}
                                    className="player-comment-avatar"
                                    src={`${config.githubAvatarUri}${'ramko9999'}`} />
                                <div>ramko9999</div>

                            </div>
                            <div className="player-comment-content">
                                Wtf is this???!!
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default Comments;