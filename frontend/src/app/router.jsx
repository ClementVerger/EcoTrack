import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Map from "../pages/Map";
import Reports from "../pages/Reports";
import NotFound from "../pages/NotFound";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "map", element: <Map /> },
      { path: "reports", element: <Reports /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default router;
