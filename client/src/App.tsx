import "./App.css";
import AppRouter from "./routers/Router";
import Navbar from "./components/navbar";

function App() {
  return (
    <>
      <div className="app">
        <Navbar />
        <div className="main-section">
          <AppRouter />
        </div>
        <div className="footer-section"></div>
      </div>
    </>
  );
}

export default App;
