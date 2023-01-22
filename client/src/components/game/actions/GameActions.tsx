import {
  GameState,
  LobbyPayload,
  Player,
  SourceCodePayload,
} from "../../../Interface";

export const LobbyAction = (
  state: GameState,
  payload: LobbyPayload
): GameState => {
  const hostPlayer = payload.players.find((p) => p.is_host) as Player;
  return {
    ...state,
    players: payload.players.filter((p) => p.is_connected),
    host: hostPlayer.username,
  };
};

export const SourceCodeAction = (
  state: GameState,
  payload: SourceCodePayload
): GameState => {
  return {
    ...state,
    source_code: payload.code,
  };
};
