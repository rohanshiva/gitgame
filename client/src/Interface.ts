export interface Player {
  username: string;
  profile_url: string;
  is_connected: boolean;
  is_host: boolean;
}

export interface Code {
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
}

export enum RequestType {
  PICK_SOURCE_CODE = 1,
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

export interface GameState {
  players: Player[];
  host: string;
  source_code: Code;
}

export const lobbyCode: Code = {
  author: "",
  content: "Waiting for players...",
  file_name: "lobby_waiting_for_players",
  file_extension: "markdown",
  file_visit_url: "",
};
