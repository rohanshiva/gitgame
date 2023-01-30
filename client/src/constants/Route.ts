export const baseRoutes_ = {
    root: "/",
    game: "/game/:sessionId/:username",
    join: "/game/:sessionId",
    playground: "/playground"
};

const routes_ = {
    root: () => baseRoutes_.root,
    game: (sessionId: string, username: string) => baseRoutes_.game.replace(":sessionId", sessionId).replace(":username", username),
    join: (sessionId: string) => baseRoutes_.join.replace(":sessionId", sessionId)
};


  
export default routes_;