import IGameState, { SessionState } from "../../../interfaces/GameState";

export const LobbyAction = (state: IGameState, payload: any) => {
    return {...state, players: payload.players, host: payload.host, state: SessionState.IN_LOBBY}
}