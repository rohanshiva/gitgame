import { Toaster } from "react-hot-toast";

export const SUCCESS = {
  duration: 4000,
  position: "bottom-right",
  // Styling
  style: {
    backgroundColor: "#0E9860",
    color: "white",
    fontWeight: "bold",
    borderRadius: "3px",
  },
  // Custom Icon
  // Change colors of success/error/loading icon
  iconTheme: {
    primary: "#000",
    secondary: "#fff",
  },
  // Aria
  ariaProps: {
    role: "status",
    "aria-live": "polite",
  },
};

export const LOADING = {
  // Styling
  style: {
    backgroundColor: "#127DBD",
    color: "white",
    fontWeight: "bold",
    borderRadius: "0.2rem",
  },
};

export const ERROR = {
  duration: 4000,
  position: "bottom-right",
  // Styling
  style: {
    backgroundColor: "#EF0100",
    color: "white",
    fontWeight: "bold",
    borderRadius: "0.2rem",
  },
};

export enum NotificationDisplay {
  CONNECTING = "connecting",
  NEXT_ROUND = "next_round",
}

export const toastWithId = (style: any, id: string) => {
  return { ...style, id };
};
function Notification() {
  return <Toaster position="bottom-right" reverseOrder={true} />;
}

export default Notification;
