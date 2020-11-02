
import React from "react";
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import PanToolIcon from '@material-ui/icons/PanTool';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import RemoveCircleIcon from '@material-ui/icons/RemoveCircle';
import { makeStyles } from "@material-ui/core/styles";
import { Typography } from "@material-ui/core";


const useStyles = makeStyles({
    editButton: {
      fontSize: '0.9rem',
      textTransform: 'none',
    },
    editIcon: {
      marginRight: '0.25rem',
      width: '0.8em'
    }
  });

const PointEditSettings = ({state, dispatch}) => {
    const classes = useStyles()
    return (
      <div style={{position: 'absolute', top:0, right: 0}}>
                <Typography align="right" variant="body2">Edit points</Typography>
      <ToggleButtonGroup
        value={state.pointEdit}
        size="small"
        exclusive
        onChange={(event, newVal) =>
          dispatch({ name: "pointEdit", value: newVal })
        }
        aria-label="Edit points"
      >
        <ToggleButton className={classes.editButton} value="drag" aria-label="drag point">
          <PanToolIcon className={classes.editIcon} fontSize="small" />
          Drag
        </ToggleButton>
        <ToggleButton className={classes.editButton} value="add" aria-label="add point">
          <AddCircleIcon className={classes.editIcon} fontSize="small" />
          Add
        </ToggleButton>
        <ToggleButton className={classes.editButton} value="delete" aria-label="delete point">
          <RemoveCircleIcon className={classes.editIcon} fontSize="small" />
          Delete
        </ToggleButton>
      </ToggleButtonGroup>

      </div>
    );
  };

  export default PointEditSettings