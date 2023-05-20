import { Player } from "../../../Interface";
import { getColor } from "../../../utils";
import { applyPlayerDisplayOrder } from "../Util";
import "./Lobby.css";

interface LobbyProps {
  players: Player[];
  locationUser: string;
}

function Lobby({ players, locationUser }: LobbyProps) {
  return (
    <div className="lobby-container">
      {applyPlayerDisplayOrder(players, locationUser).map(
        ({ username, profile_url, is_host }, index) => {
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
        }
      )}
    </div>
  );
}

export default Lobby;
