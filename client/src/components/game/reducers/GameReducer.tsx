import {
  AckNewCommentAction,
  CommentsAction,
  LobbyAction,
  NewCommentAction,
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
  NewCommentPayload,
  GameStateDispatchEvent,
  GameStateDispatchEventType,
  AckNewComment,
} from "../../../Interface";

function getNewStateFromWSResponse(state: GameState, payload: ResponsePayload) {
  switch (payload.message_type) {
    case ResponseType.LOBBY:
      return LobbyAction(state, payload as LobbyPayload);
    case ResponseType.SOURCE_CODE:
      return SourceCodeAction(state, payload as SourceCodePayload);
    case ResponseType.COMMENTS:
      return CommentsAction(state, payload as CommentsPayload);
    case ResponseType.NEW_COMMENT:
      return NewCommentAction(state, payload as NewCommentPayload);
    default:
      return state;
  }
}

function reduceWsResponse(state: GameState, payload: ResponsePayload) {
  let messages = [payload];
  if (payload.message_type === ResponseType.BATCH) {
    messages = (payload as BatchPayload).messages;
  }
  let newState = state;
  for (const message of messages) {
    newState = getNewStateFromWSResponse(newState, message);
  }
  return newState;
}

export default function gameReducer(
  state: GameState,
  event: GameStateDispatchEvent
) {
  switch (event.event_type) {
    case GameStateDispatchEventType.WS_RESPONSE:
      return reduceWsResponse(state, event as ResponsePayload);
    case GameStateDispatchEventType.ACK_NEW_COMMENT:
      return AckNewCommentAction(state, (event as AckNewComment).comment_id);
  }
}
