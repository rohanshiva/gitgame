const config = {
  baseUri: process.env.REACT_APP_HTTP_ENDPOINT,
  wsUri: process.env.REACT_APP_WS_ENDPOINT,
  demoVideoUri: process.env.REACT_APP_DEMO_VIDEO,
  helpVideoUri: process.env.REACT_APP_HELP_VIDEO,
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
