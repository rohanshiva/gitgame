import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import routes_ from "../../constants/route";
import "./Home.css";
import SessionService from "../../services/session";

function Home() {
  const history = useHistory();
  const [username, setUsername] = useState<string>("");
  const [players, setPlayers] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState<Boolean>(false);

  const deletePlayer = (key: number) => {
    setPlayers((_players: string[]) => _players.filter((_, _key: number) => _key !== key));
  };

  const onKeyDown = (event: any) => {
    const { key } = event;
    if (
      (key === "," || key === "Enter") &&
      username.length &&
      !players.includes(username)
    ) {
      event.preventDefault();
      setPlayers((_players: string[]) => [..._players, username]);
      setUsername("");
    }
  };

  const handleSubmit = (event: any) => {
    event.preventDefault();
    setLoading(true);
    SessionService.makeSession(players)
      .then(({ id }) => {
        history.replace({
          pathname: routes_.game(id)
        });
      })
      .catch((error) => {
        console.log(error);
        setErrorMessage(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <>
      <div className="name_container">
        <form onSubmit={handleSubmit}>
          <input
            className="name_input"
            type="text"
            placeholder="username"
            spellCheck="false"
            onKeyDown={onKeyDown}
            onChange={(event) => setUsername(event.target.value)}
            value={username}
          />
          <input className="name_submit" type="submit" value="Play" />
        </form>
      </div>
      <div className="player_tags">
        {players.map((name: string, key: number) => (
          <div className="player_tag" key={key} onClick={() => deletePlayer(key)}>
            {name}
          </div>
        ))}
      </div>
    </>
  );
}

export default Home;
