import { Link } from "react-router-dom";
import React from "react";
const NotFoundPage = () => {
  return (
    <div className="min-h-[calc(100vh-64px)]  flex flex-col items-center justify-center bg-base-100 text-center px-4">
      <h1 className="text-6xl font-bold text-error">404</h1>
      <p className="text-xl mt-4">Oops! Page not found</p>
      <p className="text-base-content/60 mt-2">
        The route you are trying to access does not exist.
      </p>

      <Link to="/login" className="mt-6 px-6 py-2 bg-primary text-white rounded-lg">
        Go Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
