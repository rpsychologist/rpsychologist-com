import React from "react";
import { csvParse } from "d3-dsv";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import GridOnIcon from "@material-ui/icons/GridOn";

const useStyles = makeStyles((theme) => ({
  input: {
    display: "none",
  },
  button: {
    width: "100%",
    marginBottom: theme.spacing(1),
  },
}));

const CsvLoad = ({ dispatch }) => {
  const classes = useStyles();
  const handleChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target.result;
      dispatch({ name: "loadCsv", value: csvParse(csv) });
    };
    reader.onerror = (e) => {
      if (e.target.error.name == "NotReadableError") {
        alert("Cannot read file !");
      }
    };
    file && reader.readAsText(file);
  };

  return (
    <>
      <input
        className={classes.input}
        type="file"
        accept=".csv"
        onChange={handleChange}
        id="button-load-csv"
      />
      <label htmlFor="button-load-csv">
        <Tooltip
          title="Load data from a CSV file"
          enterDelay={500}
          className={classes.button}
        >
          <Button
            startIcon={<GridOnIcon />}
            variant="outlined"
            color="default"
            component="span"
            fullWidth
          >
            Load CSV
          </Button>
        </Tooltip>
      </label>
    </>
  );
};
export default CsvLoad;
