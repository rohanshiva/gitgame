import { Player } from "../../../Interface";
import { getColor } from "../../../utils";
import { applyPlayerDisplayOrder } from "../Util";
import "./Lobby.css";

interface LobbyProps {
  players: Player[];
  locationUser: string;
}

function getAvatarAbbreviation({ username, is_ready }: Player) {
  if (is_ready) {
    return `${username} (Ready)`;
  }
  return username;
}

function Avatar(player: Player) {
  const { profile_url, username, is_ready } = player;
  return (
    <div
      className="avatar"
      onClick={() => {
        window.open(`https://github.com/${username}`);
      }}
    >
      <abbr title={getAvatarAbbreviation(player)}>
        <div>
          {is_ready ? "✅" : null}
        </div>
        <img
          className="avatar-image"
          src={profile_url}
          alt={username}
          style={{ borderColor: getColor(username) }}
        />
      </abbr>
    </div>
  );
}

function Lobby({ players, locationUser }: LobbyProps) {
  return (
    <div className="lobby-container">
      {applyPlayerDisplayOrder(players, locationUser).map((player, index) => {
        return <Avatar key={index} {...player} />;
      })}
    </div>
  );
}

export default Lobby;
