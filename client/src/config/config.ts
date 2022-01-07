const config = {
    baseUri: `http://127.0.0.1:8000`,
    wsUri: `ws://127.0.0.1:8000`,
    make: {
        uri: "session/make",
    },
    pick: {
        uri: "session/:sessionId/pick"
    },
    chunk: {
        uri: "session/:sessionId/chunk"
    },
    peek:  {
        uri: "session/:sessionId/peek"
    },
    getSession: {
        uri: "session/:sessionId"
    },
    socket: {
        uri: "socket/:sessionId/:username"
    },
    githubAvatarUri: "https://avatars.githubusercontent.com/"
}

export default config;