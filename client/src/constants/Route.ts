import config from "../config";

export const baseRoutes_ = {
    root: "/",
    game: "/game/:sessionId"
};

const routes_ = {
    root: () => baseRoutes_.root,
    game: (sessionId: string) => baseRoutes_.game.replace(":sessionId", sessionId)
};

export const redirectToLoginUrl = () => {
    window.location.replace(`${config.baseUri}/${config.login.uri}`);
}

export default routes_;