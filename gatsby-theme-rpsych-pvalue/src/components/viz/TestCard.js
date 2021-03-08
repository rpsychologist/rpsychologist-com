import React, { useContext, useMemo } from "react";
import { makeStyles } from "@material-ui/core/styles";
import clsx from "clsx";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import Collapse from "@material-ui/core/Collapse";
import IconButton from "@material-ui/core/IconButton";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Draggable from "react-draggable"; // The default
import Divider from '@material-ui/core/Divider'
import { SettingsContext } from "../../Viz";
import { mean } from "d3-array";
import { format } from "d3-format";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { getPower } from "./utils"
const useStyles = makeStyles((theme) => ({
  root: {
    maxWidth: 345,
    background: "none",
    backdropFilter: "blur(50px)",
  },
  expand: {
    transform: "rotate(0deg)",
    marginLeft: "auto",
    transition: theme.transitions.create("transform", {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: "rotate(180deg)",
  },
}));


const XAxisMenu = ({dispatch, xAxis}) => {
  const classes = useStyles();
  const handleChange = (event) => {
    dispatch({name: "SWITCH_AXIS", value: event.target.value})
  };
  return (     
    <FormControl className={classes.formControl}>
    <InputLabel id="select-x-axis-label">Sample dist. statistic</InputLabel>
    <Select
      labelId="select-x-axis-label"
      id="select-x-axis"
      value={xAxis}
      onChange={handleChange}
    >
      <MenuItem value={'mean'}>Mean</MenuItem>
      <MenuItem value={'zValue'}>Z</MenuItem>
      <MenuItem value={'pValue'}>p-value</MenuItem>
    </Select>
  </FormControl>
  )

}

export default function TestCard() {
  const classes = useStyles();
  const [expanded, setExpanded] = React.useState(true);
  const { state, dispatch } = useContext(SettingsContext);
  const mobile = useMediaQuery('(max-width:400px)');

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };
  const propSignificant = useMemo(() => mean(state.data.map((d) => d.pval < 0.05)), [state.data]);
  const effectOnlySignificantSample = useMemo(() => (mean(state.data.filter((d) => d.Z > 1.96).map((d) => d.xMean)) - state.M0) / state.SD, [state.data, state.M0, state.SD])
  const power = useMemo(() => getPower(0.05, state.cohend, state.n), [state.cohend, state.n])
  const effectWholeSample = useMemo(() => mean(state.data.map(d => (d.xMean - state.M0)/state.SD)), [state.data, state.M0, state.SD])
  const addSample = (add = 1) => {
    dispatch({ name: "DRAW", value: add });
  };
  const addObservation = () => {
    dispatch({name: "ADD_ONE_OBS", value: ""})
  }
  const removeObservation = () => {
    if(state.n > 1) dispatch({name: "REMOVE_ONE_OBS", value: ""})
  }
  const addObservationsPhack = (add = 1) => {
    dispatch({name: "PHACK", value: add})
  }
  const toggleAxis= () => {
    dispatch({name: "SWITCH_AXIS", value: ""})
  }
  const clear = () => {
    dispatch({name: "CLEAR", value: ""})
  }
  return (
    <Draggable handle="#handle">
      <Card
        className={classes.root}
        style={{ position: "absolute", top: mobile ? "100px" : "0px", right: "0px" }}
      >
           <Typography variant="body2" align="right" color="textSecondary" id="handle" style={{paddingRight: '1em', cursor: 'move'}}>
            Drag
          </Typography>
        <CardContent >
          <Typography variant="body2" color="textPrimary">
            Draw samples
          </Typography>
          <ButtonGroup
            disableElevation
            variant="contained"
            color="default"
            style={{ width: "100%" }}
          >
            <Button onClick={() => addSample(1)}>+1</Button>
            <Button onClick={() => addSample(50)}>+50</Button>
            <Button onClick={() => addSample(500)}>+500</Button>
          </ButtonGroup>
          <Typography variant="body2" color="textPrimary">
            Observations
          </Typography>
          <ButtonGroup
            disableElevation
            variant="contained"
            color="default"
            style={{ width: "100%" }}
          >
            <Button onClick={removeObservation} disabled={state.n < 2}>-1</Button>
            <Button onClick={addObservation}>+1</Button>
            <Button onClick={addObservationsPhack}>P Hack</Button>

          </ButtonGroup>
          <Divider style={{marginTop: '5px', marginBottom: '5px'}}/>
          <ButtonGroup
            disableElevation
            variant="contained"
            color="default"
            style={{ width: "100%" }}
          >
          <XAxisMenu dispatch={dispatch} xAxis={state.xAxis} />
        </CardContent>
        <CardActions disableSpacing>
          <Typography variant="body1">Stats</Typography>
          <IconButton
            className={clsx(classes.expand, {
              [classes.expandOpen]: expanded,
            })}
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label="show more"
          >
            <ExpandMoreIcon />
          </IconButton>
        </CardActions>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent style={{paddingTop: 0}}>
          <Typography align="right" component="p" variant="body2">
              # Draws: {state.data.length}
            </Typography>
            <Typography align="right" component="p" variant="body2">
              n: {state.n}
            </Typography>
            <Typography align="right" component="p" variant="body2" style={{fontWeight: 700}}>
              {state.cohend > 0 ? "Power" : "Type I Error"}:{" "}
              {format(".2f")(propSignificant)}
            </Typography>
            <Typography align="right" component="p" variant="body2">
              Power (true): {format(".2f")(power)}
            </Typography>
            <Typography align="right" component="p" variant="body2">
              ES (true): {format(".1f")(state.cohend)}
            </Typography>
            <Typography align="right" component="p" variant="body2">
              ES (sim): {format(".1f")(effectWholeSample)}
            </Typography>
            <Typography align="right" component="p" variant="body2">
              ES (pub. bias): {format(".1f")(effectOnlySignificantSample)}
            </Typography>
          </CardContent>
        </Collapse>
      </Card>
    </Draggable>
  );
}
