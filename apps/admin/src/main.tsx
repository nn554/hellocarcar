import { Refine } from "@refinedev/core";
import dataProvider from "@refinedev/simple-rest";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { API_BASE } from "./api";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Refine dataProvider={dataProvider(API_BASE + "/v1")} resources={[]}>
      <App />
    </Refine>
  </React.StrictMode>
);
