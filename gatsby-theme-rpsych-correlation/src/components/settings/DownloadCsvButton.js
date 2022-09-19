import React from "react";
import { handleDownloadCsv } from "./saveCsv";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import GridOnIcon from "@material-ui/icons/GridOn";
import Tooltip from "@material-ui/core/Tooltip";
import SaveAltIcon from "@material-ui/icons/SaveAlt";

const useStyles = makeStyles((theme) => ({
  button: {
    width: "100%",
    marginBottom: theme.spacing(1),
  },
}));

export const DownloadCsvButton = ({ data, filename }) => {
  const classes = useStyles();
  return (
    <Tooltip
      title="Export scatter plot to a CSV file"
      enterDelay={500}
      className={classes.button}
    >
      <Button
        startIcon={<SaveAltIcon />}
        variant="outlined"
        color="primary"
        onClick={() => handleDownloadCsv(data, filename)}
        fullWidth
      >
        Download CSV
      </Button>
    </Tooltip>
  );
};
export default DownloadCsvButton;
