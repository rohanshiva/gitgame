export enum CommentType {
    POOP = "poop",
    DIAMOND = "diamond"
}

export interface Lines {
    start: number,
    end: number
}

export interface Comment {
    message?: string,
    lines: Lines
    commentType: CommentType
}