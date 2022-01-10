import IAnswer, { IRepository } from "../../../interfaces/Answer";
import IGameState, { SessionState } from "../../../interfaces/GameState";
import SessionService from "../../../services/Session";

export const LobbyAction = (state: IGameState, payload: any): IGameState => {
  return { ...state, players: payload.players, host: payload.host };
};

export const PromptAction = (state: IGameState, payload: any): IGameState => {
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

export const AnswerRevealAction = (state: IGameState, payload: any): IGameState => {

  const { name, url, description, star_count, language } = payload.repo;

  const repository: IRepository = {
    name, url, description, language, starCount: star_count
  };

  return {
    ...state,
    state: SessionState.DONE_GUESSING,
    answer: { players: payload.players, correctChoice: payload.correct_choice, repository}
  };
};

export const OutOfChunksAction = (state: IGameState, payload: any) => {
  return { ...state, state: SessionState.OUT_OF_CHUNKS };
};
