import IPlayer from "./Player";

export enum ServerMessageType {
  LOBBY = "lobby",
  HOST_CHANGE = "host_change",
  OUT_OF_CHUNKS = "out_of_chunks",
  PROMPT = "prompt",
  ANSWER_REVEAL = "answer_reveal",
  PEEK = "peek",
}

export enum SessionState {
  NEWLY_CREATED = "newly_created",
  IN_LOBBY = "in_lobby",
  IN_GUESSING = "in_guessing",
  DONE_GUESSING = "done_guessing",
  OUT_OF_CHUNKS = "out_of_chunks",
}
export default interface IGameState {
  players: IPlayer[];
  host: IPlayer;
  state: SessionState;
}
