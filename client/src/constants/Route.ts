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

export function redirectToLoginUrl(params: LoginParams) {
  window.location.replace(constructRedirectToLoginUrl(params));
}

export function constructRedirectToLoginUrl({
  referrer,
  didCookieExpirePostAuth,
}: LoginParams) {
  const queryParams = new URLSearchParams();
  if (didCookieExpirePostAuth) {
    queryParams.append("didCookieExpirePostAuth", "true");
  }
  if (referrer) {
    queryParams.append("referrer", referrer);
  }
  const paramString = queryParams.toString();
  if (paramString.length > 0) {
    return `${baseRoutes_.root}?${paramString}`;
  }
  return baseRoutes_.root;
}

export default routes_;
