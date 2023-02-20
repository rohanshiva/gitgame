import {
  GameState,
  LobbyPayload,
  Player,
  SourceCodePayload,
  CommentsPayload,
  NewCommentPayload
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
):  GameState => {

  let updates = {source_code: payload.code, comments: state.comments, new_comments: state.new_comments};
  if(state.source_code.id !== payload.code.id){
    updates.comments = [];
    updates.new_comments = [];
  } 

  return {
    ...state,
    ...updates
  };
};

export const CommentsAction = (
  state: GameState, payload: CommentsPayload
): GameState => {
  return {
    ...state,
    comments: payload.comments
  }
}

export const NewCommentAction = (state: GameState, payload: NewCommentPayload): GameState => {
  return {
    ...state,
    new_comments: [...state.new_comments, payload.comment]
  }
}

export const AckNewCommentAction = (state: GameState, comment_id: string): GameState => {
  return {
    ...state,
    new_comments: state.new_comments.filter(({id}) => comment_id !== id)
  }
}