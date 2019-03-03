import React from "react";
import ReactDOM from "react-dom";
import App from "./components/app.js";
import store from "../store/index.js";

ReactDOM.render(<App gameStore={store} />, document.getElementById("ui-container"));
