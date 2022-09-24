import React from "react";

export const IsInfinite = ({ value, children }) => {
  return <>{isFinite(value) ? value : children}</>;
};
