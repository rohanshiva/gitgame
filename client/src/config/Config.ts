const config = {
  baseUri: `http://127.0.0.1:8001`,
  wsUri: `ws://127.0.0.1:8001`,
  make: {
    uri: "session/make",
  },
  pick: {
    uri: "session/:sessionId/pick",
  },
  chunk: {
    uri: "session/:sessionId/chunk",
  },
  peek: {
    uri: "session/:sessionId/peek",
  },
  getSession: {
    uri: "session/:sessionId",
  },
  socket: {
    uri: "socket/:sessionId",
  },
};

export default config;
