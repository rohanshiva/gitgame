export const baseRoutes_ = {
    root: "/",
    game: "/game/:sessionId"
};

const routes_ = {
    root: () => baseRoutes_.root,
    game: (sessionId: string) => baseRoutes_.game.replace(":sessionId", sessionId)
};



export default routes_;