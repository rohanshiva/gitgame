import IGameState, { SessionState } from "../../../interfaces/GameState";
import SessionService from "../../../services/session";

export const LobbyAction = (state: IGameState, payload: any) => {
  return { ...state, players: payload.players, host: payload.host };
};

export const PromptAction = (state: IGameState, payload: any) => {
  const chunk = SessionService.processChunkFromJson(payload.chunk);
  return {
    ...state,
    state: SessionState.IN_GUESSING,
    prompt: {
      chunk,
      choices: payload.choices,
      endTimestamp: payload.guessing_end_timestamp,
    },
  };
};

export const AnswerRevealAction = (state: IGameState, payload: any) => {
  console.info(payload);
  return {
    ...state,
    state: SessionState.DONE_GUESSING,
    answer: {players: payload.players, correctChoice: payload.correct_choice}
  };
};

export const OutOfChunksAction = (state: IGameState, payload: any) => {
  return { ...state, state: SessionState.OUT_OF_CHUNKS };
};
