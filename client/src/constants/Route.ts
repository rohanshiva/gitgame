export const baseRoutes_ = {
  root: "/",
  game: "/game/:sessionId",
};

const routes_ = {
  root: () => baseRoutes_.root,
  game: (sessionId: string) =>
    baseRoutes_.game.replace(":sessionId", sessionId),
};

export interface LoginParams {
  referrer?: string;
  didCookieExpirePostAuth?: boolean;
}

export function redirectToLoginUrl(params: LoginParams){
  window.location.replace(constructRedirectToLoginUrl(params));
}

export function constructRedirectToLoginUrl(params: LoginParams) {
  const queryParams = new URLSearchParams();
  if (params.didCookieExpirePostAuth) {
    queryParams.append("didCookieExpirePostAuth", "true");
  }
  if (params.referrer) {
    queryParams.append("referrer", params.referrer);
  }
  const paramString = queryParams.toString();
  if (paramString.length > 0) {
    return `${baseRoutes_.root}?${paramString}`;
  }
  return baseRoutes_.root;
}

export default routes_;
