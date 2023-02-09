import { Player } from "../../../Interface";
import { getColor } from "../../../utils";
import "./Lobby.css";

interface LobbyProps {
  players: Player[];
  locationUser: string;
}

function Lobby({ players, locationUser }: LobbyProps) {
  const getDisplayOrder = () => {
    return players.sort((a, b) => {
      if (a.username === locationUser) {
        return -1;
      }
      if (b.username === locationUser) {
        return 1;
      }
      if (a.is_host) {
        return -1;
      }
      if (b.is_host) {
        return -1;
      }
      if (a.username < b.username) {
        return -1;
      } else {
        return 1;
      }
    });
  };

  return (
    <div className="lobby-container">
      {getDisplayOrder().map(({ username, profile_url, is_host }, index) => {
        const color = getColor(username);
        let abbrevationTitle = username;
        if (is_host) {
          abbrevationTitle += " (Host)";
        }

        return (
          <div
            className="lobby-player"
            onClick={() => {
              window.open(`https://github.com/${username}`);
            }}
            key={index}
          >
            <abbr title={abbrevationTitle}>
              {is_host && <div>👑</div>}
              <img
                className="lobby-avatar"
                src={profile_url}
                alt={username}
                style={{ borderColor: color }}
              />
            </abbr>
          </div>
        );
      })}
    </div>
  );
}

export default Lobby;
