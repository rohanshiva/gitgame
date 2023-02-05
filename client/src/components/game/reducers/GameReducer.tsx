import {
  CommentsAction,
  LobbyAction,
  SourceCodeAction,
} from "../actions/GameActions";
import {
  GameState,
  LobbyPayload,
  ResponsePayload,
  ResponseType,
  SourceCodePayload,
  CommentsPayload,
  BatchPayload,
} from "../../../Interface";


function getNewState(state: GameState, payload: ResponsePayload) {
  switch (payload.message_type) {
    case ResponseType.LOBBY:
      return LobbyAction(state, payload as LobbyPayload);
    case ResponseType.SOURCE_CODE:
      return SourceCodeAction(state, payload as SourceCodePayload);
    case ResponseType.COMMENTS:
      return CommentsAction(state, payload as CommentsPayload);
    default:
      return state;
  }

}

export default function gameReducer(
  state: GameState,
  payload: ResponsePayload
) {
  let messages = [payload];
  if (payload.message_type === ResponseType.BATCH) {
    messages = (payload as BatchPayload).messages;
  }

  let newState = state;
  for (const message of messages) {
    newState = getNewState(newState, message);
  }

  return newState;
}
