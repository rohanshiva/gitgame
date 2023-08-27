import toast from "react-hot-toast";
import { useHistory } from "react-router-dom";
import { StatusCodes } from "http-status-codes";
import routes_, { redirectToLoginUrl } from "../../constants/Route";
import Api from "../../services/HttpApi";
import { toastStyles } from "../notifications/Notification";
import { RedirectionToLoginReason } from "../../Interface";

function MakeForm() {
  const history = useHistory();

  const handleMakeFormSubmit = (event: any) => {
    event.preventDefault();
    const loadingToast = toast.loading(
      "Making session...",
      toastStyles.NEUTRAL
    );
    Api.makeSession()
      .then((id) => {
        toast.dismiss(loadingToast);
        toast("Session created successfully!", toastStyles.POSITIVE);
        history.replace({
          pathname: routes_.game(id),
        });
      })
      .catch((error) => {
        toast.dismiss(loadingToast);
        const { response } = error;
        if (response.status === StatusCodes.UNAUTHORIZED) {
          redirectToLoginUrl({
            redirectionToLoginReason:
              RedirectionToLoginReason.COOKIE_EXPIRATION,
          });
        } else {
          toast(
            `Failed to create session with error: ${error.message}`,
            toastStyles.NEGATIVE
          );
        }
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
