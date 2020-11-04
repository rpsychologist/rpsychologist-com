import React from "react";
import ToggleButton from "@material-ui/lab/ToggleButton";
import EditIcon from "@material-ui/icons/Edit";
import IconButton from "@material-ui/core/IconButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import PanToolIcon from "@material-ui/icons/PanTool";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import RemoveCircleIcon from "@material-ui/icons/RemoveCircle";
import { makeStyles } from "@material-ui/core/styles";
import Grow from "@material-ui/core/Grow";
import Grid from "@material-ui/core/Grid";
import Tooltip from "@material-ui/core/Tooltip";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    border: `none`,
    flexWrap: "wrap",
    height: '2em',
    alignItems: 'center',
    position: "absolute", 
    top: 0, 
    right: 0 
  },
  group: {
    height: '100%',
  },
  editButton: {
    fontSize: "0.9rem",
    textTransform: "none",
  },
  moreButton: {
    height: '1.5em',
    width: '1.5em'
  },
  editIcon: {
    marginRight: "0.25rem",
    width: "0.8em",
  },
}));

const PointEditSettings = ({ state, dispatch }) => {
  const classes = useStyles();
  return (
      <div className={classes.root} justify="flex-end">
        <Grow
          in={state.showPointEdit}
          style={{ transformOrigin: "center right" }}
        >
          <ToggleButtonGroup
            className={classes.group}
            value={state.pointEdit}
            size="small"
            exclusive
            onChange={(event, newVal) =>
              dispatch({ name: "pointEdit", value: newVal })
            }
            aria-label="Edit points"
          >
            <ToggleButton
              className={classes.editButton}
              value="drag"
              aria-label="drag point"
            >
              <PanToolIcon className={classes.editIcon} fontSize="small" />
              Drag
            </ToggleButton>
            <ToggleButton
              className={classes.editButton}
              value="add"
              aria-label="add point"
            >
              <AddCircleIcon className={classes.editIcon} fontSize="small" />
              Add
            </ToggleButton>
            <ToggleButton
              className={classes.editButton}
              value="delete"
              aria-label="delete point"
            >
              <RemoveCircleIcon className={classes.editIcon} fontSize="small" />
              Delete
            </ToggleButton>
          </ToggleButtonGroup>
        </Grow>
        <Tooltip title="Edit data points" enterDelay={500}>
        <IconButton
          className={classes.moreButton}
          onClick={() => dispatch({ name: "togglePointEdit" })}
          aria-label="toggle point edit settings"
        >
          <EditIcon fontSize="small" />
        </IconButton>
        </Tooltip>
      </div>
  );
};

export default PointEditSettings;
