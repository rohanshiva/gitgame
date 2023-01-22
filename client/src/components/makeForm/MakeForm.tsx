import { useState } from "react";
import toast from "react-hot-toast";
import { useHistory } from "react-router-dom";
import routes_ from "../../constants/Route";
import SessionService from "../../services/Session";
import { SUCCESS, LOADING, ERROR } from "../notifications/Notification";

interface MakeFormState {
  username: string;
}

function MakeForm() {
  const history = useHistory();
  const [makeData, setMakeData] = useState<MakeFormState>({
    username: "",
  });

  const handleMakeFormSubmit = (event: any) => {
    event.preventDefault();
    const loadingToast = toast.loading("Making session...", LOADING as any);
    const username = makeData.username;
    SessionService.makeSession()
      .then((id) => {
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

  return (
    <>
      <h2>Make Session </h2>
      <form className="make-form" onSubmit={handleMakeFormSubmit}>
        <div>
          <input
            type="text"
            placeholder="username"
            spellCheck="false"
            value={makeData.username}
            onChange={(event) =>
              setMakeData({ ...makeData, username: event.target.value })
            }
          />
          <input type="submit" value="Make" />
        </div>
      </form>
    </>
  );
}

export default MakeForm;
