import toast from "react-hot-toast";
import { SUCCESS, ERROR, LOADING } from "../../notifications/Notification";
import { ServerMessageType } from "../../../interfaces/GameState";
import { LobbyAction } from "../actions/GameActions";
export default function gameReducer(
  state: any,
  [type, payload]: [string, any]
) {
  switch (type) {
    case ServerMessageType.LOBBY:
      return LobbyAction(state, payload);
  }
  return state;
}
