const config = {
    baseUri: `http://127.0.0.1:8000`,
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
        uri: "session/:sessionId/peek?direction={direction}"
    },
    getSession: {
        uri: "session/:sessionId"
    }
}

export default config;