export enum CommentType {
  POOP = "poop",
  DIAMOND = "diamond",
}

export interface Lines {
  start: number;
  end: number;
}

export interface Author {
  username: string;
  profile_url: string;
}

export interface AddComment {
  content: string;
  line_start: number;
  line_end: number;
  type: CommentType;
}

export interface Comment {
  content: string;
  line_start: number;
  line_end: number;
  type: CommentType;
  id: string;
  author: Author;
}

export const commentTypeToEmoji = (commentType: CommentType) => {
  return commentType === CommentType.POOP ? "💩" : "💎";
};

export interface Player {
  username: string;
  profile_url: string;
  is_connected: boolean;
  is_ready: boolean;
}

export interface Code {
  id: string;
  author: string;
  content: string;
  file_name: string;
  file_extension: string;
  file_visit_url: string;
  file_display_path: string;
}

export enum AlertType {
  NEGATIVE = 0,
  POSITIVE = 1,
  NEUTRAL = 2,
}

export interface Alert {
  message: string;
  type: AlertType;
}

export enum ResponseType {
  ALERT = 0,
  ERROR = 1,
  GAME_FINISHED = 2,
  LOBBY = 3,
  SOURCE_CODE = 4,
  COMMENTS = 5,
  BATCH = 6,
  NEW_COMMENT = 7,
}

export enum RequestType {
  ADD_COMMENT = 1,
  READY = 2,
  WAIT = 3,
}

export enum GameStateEventType {
  WS_RESPONSE = 1,
  ACK_NEW_COMMENT = 2,
}

export interface GameStateEvent {
  event_type: GameStateEventType;
}

export interface ResponsePayload extends GameStateEvent {
  message_type: ResponseType;
}

export interface LobbyPayload extends ResponsePayload {
  players: Player[];
}

export interface SourceCodePayload extends ResponsePayload {
  code: Code;
}

export interface AlertPayload extends ResponsePayload {
  alert: Alert;
}

export interface CommentsPayload extends ResponsePayload {
  comments: Comment[];
}

export interface NewCommentPayload extends ResponsePayload {
  comment: Comment;
}

export interface BatchPayload extends ResponsePayload {
  messages: ResponsePayload[];
}

export interface AckNewComment extends GameStateEvent {
  comment_id: string;
}

export enum GameStatus {
  CONNECTING,
  IN_LOBBY,
  PLAYING,
  FINISHED,
}

export interface GameState {
  players: Player[];
  source_code: Code | null;
  comments: Comment[];
  new_comments: Comment[];
  status: GameStatus;
}

export interface User {
  username: string;
}

export enum RedirectionToLoginReason {
  UNEXPECTED_AUTH_FAILURE = 0,
  USER_DENIED_GITHUB_AUTH = 1,
  COOKIE_EXPIRATION = 2,
}
