const config = {
  baseUri: process.env.REACT_APP_HTTP_ENDPOINT,
  wsUri: process.env.REACT_APP_WS_ENDPOINT,
  demoUri: process.env.REACT_APP_DEMO_VIDEO,
  helpLineClickUri: process.env.REACT_APP_HELP_LINE_CLICK,
  helpShiftLineClickUri: process.env.REACT_APP_HELP_SHIFT_LINE_CLICK,
  helpTriggerCommentMenuUri: process.env.REACT_APP_HELP_TRIGGER_COMMENT_MENU,
  helpAddPoopCommentUri: process.env.REACT_APP_HELP_ADD_POOP_COMMENT,
  helpAddDiamondCommentUri: process.env.REACT_APP_HELP_ADD_DIAMOND_COMMENT,
  make: {
    uri: "session/make",
  },
  socket: {
    uri: "socket/:sessionId",
  },
  user: {
    uri: "user/"
  },
  login: {
    uri: "auth/login"
  },
  feedback: {
    uri: "misc/feedback"
  }
};

export default config;
