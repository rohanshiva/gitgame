import { RedirectionToLoginReason } from "../Interface";

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
  redirectionToLoginReason?: RedirectionToLoginReason;
}

export function redirectToLoginUrl(params: LoginParams) {
  window.location.replace(constructRedirectToLoginUrl(params));
}

export function constructRedirectToLoginUrl({
  referrer,
  redirectionToLoginReason,
}: LoginParams) {
  const queryParams = new URLSearchParams();
  if (redirectionToLoginReason) {
    queryParams.append(
      "redirection_reason",
      redirectionToLoginReason.toString()
    );
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
