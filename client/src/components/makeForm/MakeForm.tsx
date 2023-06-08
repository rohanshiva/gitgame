import toast from "react-hot-toast";
import { useHistory } from "react-router-dom";
import routes_ from "../../constants/Route";
import Api from "../../services/HttpApi";
import { SUCCESS, LOADING, ERROR } from "../notifications/Notification";

function MakeForm() {
  const history = useHistory();

  const handleMakeFormSubmit = (event: any) => {
    event.preventDefault();
    const loadingToast = toast.loading("Making session...", LOADING as any);
    Api.makeSession()
      .then((id) => {
        toast.dismiss(loadingToast);
        toast("Session created successfully!", SUCCESS as any);
        history.replace({
          pathname: routes_.game(id),
        });
      })
      .catch((error) => {
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
      <form className="make-form" onSubmit={handleMakeFormSubmit}>
        <div>
          <input type="submit" value="Play" />
        </div>
      </form>
    </>
  );
}

export default MakeForm;
