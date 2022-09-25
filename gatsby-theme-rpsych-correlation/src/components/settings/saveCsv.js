const isSafari = () =>
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const toCSV = (data) => {
  const csv = [[`"${data.xLabel}"`, `"${data.yLabel}"`], ...data.data]
    .filter((e) => e)
    .map((row) => row.map((element) => element).join(","))
    .join(`\n`);
  return csv;
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

export const handleDownloadCsv = (data, filename) => {
  var csvURL = buildURI(data);
  let link = document.createElement("a");
  link.href = csvURL;
  link.setAttribute("download", filename);
  link.click();
};
