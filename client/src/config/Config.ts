const config = {
  baseUri: process.env.REACT_APP_HTTP_ENDPOINT,
  wsUri: process.env.REACT_APP_WS_ENDPOINT,
  demoUri: process.env.REACT_APP_DEMO_VIDEO,
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
