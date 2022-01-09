import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import routes_ from "../../constants/route";
import "./Home.css";
import SessionService from "../../services/session";
import { IMakeFormData } from "../../interfaces/MakeFormData";
import { IJoinFormData } from "../../interfaces/JoinFormData";

import Notification, {
  SUCCESS,
  ERROR,
  LOADING,
} from "../notifications/Notification";
import toast from "react-hot-toast";

function Home() {
  const history = useHistory();
  const [author, setAuthor] = useState<string>("");
  const [makeData, setMakeData] = useState<IMakeFormData>({
    username: "",
    preDeterminedAuthors: [],
  });
  const [joinData, setJoinData] = useState<IJoinFormData>({
    username: "",
    sessionId: "",
  });

  // form handlers
  const onAuthorsKeyDown = (event: any) => {
    const { key } = event;
    if (
      (key === "," || key === "Enter") &&
      author.length &&
      !makeData.preDeterminedAuthors.includes(author)
    ) {
      event.preventDefault();
      setMakeData({
        ...makeData,
        preDeterminedAuthors: [...makeData.preDeterminedAuthors, author],
      });
      setAuthor("");
    }
  };

  const deleteAuthor = (key: number) => {
    setMakeData({
      ...makeData,
      preDeterminedAuthors: makeData.preDeterminedAuthors.filter(
        (_, _key: number) => _key !== key
      ),
    });
  };

  const handleMakeFormSubmit = (event: any) => {
    event.preventDefault();
    const loadingToast = toast.loading("Making session...", LOADING as any);
    const preDeterminedAuthors = makeData.preDeterminedAuthors;
    const username = makeData.username;
    SessionService.makeSession(preDeterminedAuthors)
      .then(({ id }) => {
        toast.dismiss(loadingToast);
        toast("Session created successfully!", SUCCESS as any);
        history.replace({
          pathname: routes_.game(id, username),
        });
      })
      .catch((error) => {
        console.log(error);
        toast.dismiss(loadingToast);
        toast(
          `Failed to create session with error: ${error.message}`,
          ERROR as any
        );
      })
      .finally(() => {
        toast.dismiss(loadingToast);
      });
  };

  const handleJoinFormSubmit = (event: any) => {
    event.preventDefault();
    history.replace({
      pathname: routes_.game(joinData.sessionId, joinData.username),
    });
  };

  return (
    <>
      <div className="make-session">
        <h2>Make Session </h2>
        <form className="make-form" onSubmit={handleMakeFormSubmit}>
          <input
            type="text"
            placeholder="username"
            spellCheck="false"
            value={makeData.username}
            onChange={(event) =>
              setMakeData({ ...makeData, username: event.target.value })
            }
          />
          <div>
            <input
              type="text"
              spellCheck="false"
              placeholder="Enter some github usernames to be used for file pool"
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              onKeyDown={onAuthorsKeyDown}
            />
            <input type="submit" value="Make" />
          </div>
        </form>
        <div className="author-tags">
          {makeData.preDeterminedAuthors.map((name: string, key: number) => (
            <div
              className="author-tag"
              key={key}
              onClick={() => deleteAuthor(key)}
            >
              {name}
            </div>
          ))}
        </div>
      </div>
      <div className="join-session">
        <h2> Join Session</h2>
        <form className="join-form" onSubmit={handleJoinFormSubmit}>
          <input
            type="text"
            placeholder="username"
            spellCheck="false"
            value={joinData.username}
            onChange={(event) =>
              setJoinData({ ...joinData, username: event.target.value })
            }
          />
          <div>
            <input
              type="text"
              placeholder="session id"
              spellCheck="false"
              value={joinData.sessionId}
              onChange={(event) =>
                setJoinData({ ...joinData, sessionId: event.target.value })
              }
            />
            <input type="submit" value="Join" />
          </div>
        </form>
      </div>
      <Notification />
    </>
  );
}

export default Home;
