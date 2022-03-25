import { useState } from "react";
import toast from "react-hot-toast";
import { useHistory } from "react-router-dom";
import routes_ from "../../constants/Route";
import { MakeFormData } from "../../interfaces/MakeFormData";
import SessionService from "../../services/Session";
import { SUCCESS, LOADING, ERROR } from "../notifications/Notification";

function MakeForm() {
  const history = useHistory();
  const [makeData, setMakeData] = useState<MakeFormData>({
    username: "",
    preDeterminedAuthors: [],
  });
  const [author, setAuthor] = useState<string>("");

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

  const deleteAuthor = (key: number) => {
    setMakeData({
      ...makeData,
      preDeterminedAuthors: makeData.preDeterminedAuthors.filter(
        (_, _key: number) => _key !== key
      ),
    });
  };

  return (
    <>
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
    </>
  );
}

export default MakeForm;
