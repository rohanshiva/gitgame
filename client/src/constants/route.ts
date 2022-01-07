export const baseRoutes_ = {
    root: "/",
    game: "/game/:sessionId/:username",
};

const routes_ = {
    root: () => baseRoutes_.root,
    game: (sessionId: string, username: string) => baseRoutes_.game.replace(":sessionId", sessionId).replace(":username", username)
};


  
export default routes_;