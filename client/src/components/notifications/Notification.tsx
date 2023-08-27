import { Toaster, ToastOptions } from "react-hot-toast";

const POSITIVE: ToastOptions = {
  duration: 4000,
  position: "bottom-right",
  style: {
    backgroundColor: "#0E9860",
    color: "white",
    fontWeight: "bold",
    borderRadius: "0.2rem",
  },
  iconTheme: {
    primary: "#000",
    secondary: "#fff",
  },
  ariaProps: {
    role: "status",
    "aria-live": "polite",
  },
};

const NEUTRAL: ToastOptions = {
  duration: 4000,
  position: "bottom-right",
  style: {
    backgroundColor: "#127DBD",
    color: "white",
    fontWeight: "bold",
    borderRadius: "0.2rem",
  },
};

const NEGATIVE: ToastOptions = {
  duration: 4000,
  position: "bottom-right",
  style: {
    backgroundColor: "#EF0100",
    color: "white",
    fontWeight: "bold",
    borderRadius: "0.2rem",
  },
};

function Notification() {
  return <Toaster position="bottom-right" reverseOrder={true} />;
}

export const toastStyles = { POSITIVE, NEGATIVE, NEUTRAL };

export default Notification;
