// This is a fork of 'react-csv' https://github.com/react-csv/react-csv
// MIT License
// Copyright (c) 2019 react-csv

import React from "react";
import MenuItem from "@material-ui/core/MenuItem";
import { handleDownloadCsv } from "./saveCsv";

export const MenuItemDownloadCsv = ({
  data,
  xLabel,
  yLabel,
  filename,
  children,
}) => {
  return (
    <MenuItem onClick={() => handleDownloadCsv(data, filename)}>
      {children}
    </MenuItem>
  );
};
export default MenuItemDownloadCsv;
