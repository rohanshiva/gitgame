import "./App.css";
import AppRouter from "./routers/Router";
import Navbar from "./components/navbar";

function App() {
  return (
    <>
    <Navbar/>
    <div className="app">
      <div className="container">
        <AppRouter />
      </div>
    </div>
    </>
  );
}

export default App;
