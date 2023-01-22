import { LobbyAction, SourceCodeAction } from "../actions/GameActions";
import toast from "react-hot-toast";
import { SUCCESS } from "../../notifications/Notification";
import {
  AlertPayload,
  GameState,
  LobbyPayload,
  ResponsePayload,
  ResponseType,
  SourceCodePayload,
} from "../../../Interface";

export default function gameReducer(
  state: GameState,
  [type, payload]: [ResponseType, ResponsePayload]
) {
  switch (type) {
    case ResponseType.LOBBY:
      return LobbyAction(state, payload as LobbyPayload);
    case ResponseType.SOURCE_CODE:
      return SourceCodeAction(state, payload as SourceCodePayload);
    case ResponseType.ALERT:
      //todo: 2 toasts get rendered, investigate and ensure only 1 toast gets rendered
      toast((payload as AlertPayload).alert, SUCCESS as any);
      return state;
  }
  return state;
}
