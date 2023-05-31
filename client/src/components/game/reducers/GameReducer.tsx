import {
  AckNewCommentAction,
  CommentsAction,
  GameFinishedAction,
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
  GameStateEvent,
  GameStateEventType,
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
    case ResponseType.GAME_FINISHED:
      return GameFinishedAction(state);
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

export default function gameReducer(state: GameState, event: GameStateEvent) {
  switch (event.event_type) {
    case GameStateEventType.WS_RESPONSE:
      return reduceWsResponse(state, event as ResponsePayload);
    case GameStateEventType.ACK_NEW_COMMENT:
      return AckNewCommentAction(state, (event as AckNewComment).comment_id);
  }
}
