import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { detectAndPersistPlatform } from "./lib/platform";

detectAndPersistPlatform();

createRoot(document.getElementById("root")!).render(<App />);
