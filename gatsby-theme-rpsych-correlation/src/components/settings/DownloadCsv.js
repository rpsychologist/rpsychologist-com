// This is a fork of 'react-csv' https://github.com/react-csv/react-csv
// MIT License
// Copyright (c) 2019 react-csv

import React from "react";
import MenuItem from '@material-ui/core/MenuItem';

const isSafari = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

const toCSV = (data) => {
    const csv = [[`"${data.xLabel}"`, `"${data.yLabel}"`], ...data.data]
    .filter(e => e)
    .map(
      row => row
        .map((element) => element)
        .join(',')
    )
    .join(`\n`)
    return csv
   };

const buildURI = (data, uFEFF) => {
  const csv = toCSV(data);
  const type = isSafari() ? "application/csv" : "text/csv";
  const blob = new Blob([uFEFF ? "\uFEFF" : "", csv], { type });
  const dataURI = `data:${type};charset=utf-8,${uFEFF ? "\uFEFF" : ""}${csv}`;

  const URL = window.URL || window.webkitURL;

  return typeof URL.createObjectURL === "undefined"
    ? dataURI
    : URL.createObjectURL(blob);
};

export const MenuItemDownloadCsv = ({ data, xLabel, yLabel, filename, children }) => {
  const href = buildURI(data);

  return (
    <MenuItem component="a" download={filename} target="_self" href={href}>
      {children}
    </MenuItem>
  );
};
export default MenuItemDownloadCsv;