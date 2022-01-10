import toast from "react-hot-toast";
import { ERROR, NotificationDisplay } from "../../notifications/Notification";
import IGameState, { ServerMessageType } from "../../../interfaces/GameState";
import { AnswerRevealAction, LobbyAction, PromptAction, OutOfChunksAction } from "../actions/GameActions";


export default function gameReducer(
  state: IGameState,
  [type, payload]: [string, any]
) {
  switch (type) {
    case ServerMessageType.LOBBY:
      return LobbyAction(state, payload);
    case ServerMessageType.PROMPT:
      toast.dismiss(NotificationDisplay.NEXT_ROUND);
      return PromptAction(state, payload);
    case ServerMessageType.ANSWER_REVEAL:
      return AnswerRevealAction(state, payload);
    case ServerMessageType.OUT_OF_CHUNKS:
      toast.dismiss(NotificationDisplay.NEXT_ROUND);
      toast("Out of chunks", ERROR as any);
      return OutOfChunksAction(state, payload);
  }
  return state;
}
