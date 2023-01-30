export enum CommentType {
  POOP = "poop",
  DIAMOND = "diamond"
}

export interface Lines {
  start: number,
  end: number
}

export interface Author {
  username: string,
  profile_url: string
}

export interface AddComment {
  content: string,
  line_start: number,
  line_end: number,
  type: CommentType
}

export interface Comment {
  content: string,
  line_start: number,
  line_end: number,
  type: CommentType,
  id: string,
  author: Author
}

export const commentTypeToEmoji = (commentType: CommentType) => {
 return commentType === CommentType.POOP ? "💩" : "💎"
}

export interface Player {
  username: string;
  profile_url: string;
  is_connected: boolean;
  is_host: boolean;
}

export interface Code {
  id: string;
  author: string;
  content: string;
  file_name: string;
  file_extension: string;
  file_visit_url: string;
}

export enum ResponseType {
  ALERT = 0,
  ERROR = 1,
  OUT_OF_FILES_TO_PICK = 2,
  LOBBY = 3,
  SOURCE_CODE = 4,
  COMMENTS = 5
}

export enum RequestType {
  PICK_SOURCE_CODE = 1,
  ADD_COMMENT = 2,
  DELETE_COMMENT = 3
}

export interface ResponsePayload {
  message_type: ResponseType;
}

export interface LobbyPayload extends ResponsePayload {
  players: Player[];
}

export interface SourceCodePayload extends ResponsePayload {
  code: Code;
}

export interface AlertPayload extends ResponsePayload {
  alert: string;
}

export interface CommentsPayload extends ResponsePayload {
  comments: Comment[]
}

export interface GameState {
  players: Player[];
  host: string;
  source_code: Code;
  comments: Comment[];
}

export const lobbyCode: Code = {
  id: "",
  author: "",
  content: "Waiting for players...",
  file_name: "lobby_waiting_for_players",
  file_extension: "markdown",
  file_visit_url: "",
};