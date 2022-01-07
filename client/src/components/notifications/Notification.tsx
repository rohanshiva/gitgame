import { useToasterStore, Toaster } from "react-hot-toast";

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
  icon: "✔",
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
    borderRadius: "3px",
  },
};

export const ERROR = {
  duration: 4000,
  position: "bottom-right",
  // Styling
  style: {
    backgroundColor: "#DA3637",
    color: "white",
    fontWeight: "bold",
    borderRadius: "3px",
  },
  // Custom Icon
  icon: "❌",
  // Change colors of success/error/loading icon
  iconTheme: {
    primary: "#000",
    secondary: "#fff",
  },
};

function Notification() {
  const { toasts } = useToasterStore();
  return <Toaster position="bottom-right" reverseOrder={true} />;
}

export default Notification;
