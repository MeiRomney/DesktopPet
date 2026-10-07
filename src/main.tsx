import { createRoot } from "react-dom/client";
import App from "./App";
import ControlApp from "./ControlApp";
import "./styles/index.css";

const isControl = window.location.hash === "#control";
createRoot(document.getElementById("root")!).render(
  isControl ? <ControlApp /> : <App />,
);
