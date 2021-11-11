import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import routes_ from "../../constants/route";

import * as api from "../../utils/api";
import config from "../../config/config";

import "./Home.css";

function Home() {
  const history = useHistory();
  const [username, setUsername] = useState("");
  const [players, setPlayers] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const deletePlayer = (key) => {
    setPlayers((_players) => _players.filter((_, _key) => _key !== key));
  };

  const onKeyDown = (event) => {
    const { key } = event;
    if (
      (key === "," || key === "Enter") &&
      username.length &&
      !players.includes(username)
    ) {
      event.preventDefault();
      setPlayers((_players) => [..._players, username]);
      setUsername("");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // TODO: create session api
    setLoading(true);
    api
      .post(config.make.uri, players)
      .then((res) => {
        const session = res.data;
        session.players = players;
        setLoading(false);
        history.replace({
          pathname: routes_.game,
          state: { session:session },
        });
      })
      .catch((error) => {
        console.log(error);
        setLoading(false);
        // setErrorMessage(error.response.data.error.message);
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
          <input className="name_submit" type="submit" value="Play 🤘🏿" />
        </form>
      </div>
      <div className="player_tags">
        {players.map((name, key) => (
          <div className="player_tag" key={key} onClick={() => deletePlayer(key)}>
            {name}
          </div>
        ))}
      </div>
    </>
  );
}

export default Home;
