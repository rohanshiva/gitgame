import { Player } from "../../Interface";

export function applyPlayerDisplayOrder(
  players: Player[],
  deviceUsername: string
) {
  return players.sort((a, b) => {
    if (a.username === deviceUsername) {
      return -1;
    }
    if (b.username === deviceUsername) {
      return 1;
    }
    if (a.username < b.username) {
      return -1;
    } else {
      return 1;
    }
  });
}
