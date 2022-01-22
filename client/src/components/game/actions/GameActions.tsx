import { Repository } from "../../../interfaces/Answer";
import IGameState, { SessionState } from "../../../interfaces/GameState";
import IPlayer from "../../../interfaces/Player";
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
      guessExpiration: new Date(payload.guess_expiration),
    },
  };
};

export const AnswerRevealAction = (
  state: IGameState,
  payload: any
): IGameState => {

  const { name, url, description, star_count, language } = payload.repo;

  const repository: Repository = {
    name,
    url,
    description,
    language,
    starCount: star_count,
  };

  // update the scores of the players in the lobby based on the results from the answer reveal action
  const playerMap = new Map<string, IPlayer>();
  for (const player of state.players) {
    playerMap.set(player.username, player);
  }

  for (const player of payload.players) {
    if (playerMap.has(player.username)) {
      (playerMap.get(player.username) as IPlayer).score = player.score;
    }
  }

  const mergedPlayers: IPlayer[] = [];
  playerMap.forEach((value) => {
    mergedPlayers.push(value);
  });

  return {
    ...state,
    players: mergedPlayers,
    state: SessionState.DONE_GUESSING,
    answer: {
      players: payload.players,
      correctChoice: payload.correct_choice,
      repository,
      chunkUrl: payload.chunk_url,
    }
  };
};

export const OutOfChunksAction = (state: IGameState, payload: any) => {
  return { ...state, state: SessionState.OUT_OF_CHUNKS };
};
