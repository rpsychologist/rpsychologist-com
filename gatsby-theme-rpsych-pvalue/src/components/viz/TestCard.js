import React, { useContext, useMemo, useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import clsx from "clsx";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import Collapse from "@material-ui/core/Collapse";
import Grid from "@material-ui/core/Grid";
import AddIcon from "@material-ui/icons/Add";
import RemoveIcon from "@material-ui/icons/Remove";
import IconButton from "@material-ui/core/IconButton";
import Chip from "@material-ui/core/Chip";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Draggable from "react-draggable"; // The default
import Divider from "@material-ui/core/Divider";
import { SettingsContext } from "../../Viz";
import { format } from "d3-format";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import pvalueWorker from "../settings/pvalueWorker";
import PvalueWorker from "../settings/calcPvalues.worker.js";

// Use a separate worker for stat summary calculations
const cardWorker = typeof window === "object" && new PvalueWorker();

const useStyles = makeStyles((theme) => ({
  root: {
    // fallback to semi-transparent
    // if backdrop-filter not supported
    background: theme.palette.type === 'dark' ? '#282828db':"#ffffffd6",
    maxWidth: 345,
    '@supports ((-webkit-backdrop-filter: blur(50px)) or (backdrop-filter: blur(50px)))': {
      background: "none",
      backdropFilter: "blur(50px)"
    }

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
  formControl: {
    margin: 0,
    width: "100%",
    minWidth: 120,
  },
  nLabel: {
    fontWeight: 500,
    minWidth: "65px",
  },
  clearButton: {
    margin: "5px 0",
    marginLeft: "5px",
  },
}));

const SampleStatsText = (props) => {
  const [stats, setStats] = useState(
    {
      propSignificant: 0,
      effectOnlySignificantSample: 0,
      effectWholeSample: 0,
      power: 0,
    },
    []
  );
  const { cohend } = props;
  useEffect(() => {
    cardWorker.calcSummaryStats(props).then((result) => setStats(result));
  }, [props]);

  return (
    <>
      <Typography
        align="right"
        component="p"
        variant="body2"
        style={{ fontWeight: 700 }}
      >
        {cohend > 0 ? "Power" : "Type I Error"}:{" "}
        {format(".2f")(stats.propSignificant)}
      </Typography>
      <Typography align="right" component="p" variant="body2">
        Power (true): {format(".2f")(stats.power)}
      </Typography>
      <Typography align="right" component="p" variant="body2">
        Effect size (true): {format(".1f")(cohend)}
      </Typography>
      <Typography align="right" component="p" variant="body2">
        Effect size (sim): {format(".1f")(stats.effectWholeSample)}
      </Typography>
      <Typography align="right" component="p" variant="body2">
        Effect size (pub. bias):{" "}
        {format(".1f")(stats.effectOnlySignificantSample)}
      </Typography>
    </>
  );
};

const XAxisMenu = ({
  dispatch,
  xAxis,
  data,
  phacked,
  dataBeforePhack,
  shift,
  M0,
  SD
}) => {
  const classes = useStyles();
  const handleChange = (event) => {
    dispatch({ name: "SWITCH_AXIS", value: event.target.value });
    if (event.target.value === "pValue") {
      // P-values need to be recalculated when the user
      // switch to the p-dist view
      pvalueWorker.updateData({ data: data, shift: shift, M0: M0, SD: SD }).then((result) => {
        // 'dataBeforePhack' need to be updated
        // in case the user start p-hacking in M/Z view
        // then hit 'clear' in pdist view
        if (phacked) {
          pvalueWorker
            .updateData({
              data: dataBeforePhack,
              shift: shift,
              M0: M0, 
              SD: SD 
            })
            .then((resultDataBeforePhack) => {
              dispatch({
                name: "UPDATE_DATA",
                value: {
                  data: result,
                  dataBeforePhack: resultDataBeforePhack,
                  xAxis: event.target.value,
                },
              });
            });
        } else {
          dispatch({
            name: "UPDATE_DATA",
            value: {
              data: result,
              xAxis: event.target.value,
            },
          });
        }
      });
    }
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
        <MenuItem value={"mean"}>Mean</MenuItem>
        <MenuItem value={"zValue"}>Z</MenuItem>
        <MenuItem value={"pValue"}>p-value</MenuItem>
      </Select>
    </FormControl>
  );
};

const MemoXAxisMenu = React.memo(XAxisMenu);

export default function TestCard() {
  const classes = useStyles();
  const [expanded, setExpanded] = React.useState(true);
  const { state, dispatch } = useContext(SettingsContext);
  const mobile = useMediaQuery("(max-width:400px)");
  const { data, M0, M1, xAxis, n, shift, SD } = state;

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const addSample = (add = 1) => {
    pvalueWorker
      .drawSamples({
        data: data,
        n: n,
        shift: shift,
        add: add,
        M0: M0,
        SD: SD
      })
      .then((data) => {
        dispatch({ name: "UPDATE_DATA", value: { data: data, add: add } });
      });
    //dispatch({ name: "DRAW", value: add });
  };
  const addObservation = () => {
    pvalueWorker
      .addOneObs({ data: data, M0: M0, M1: M1, SD: SD, pHack: false, xAxis: xAxis })
      .then((result) => {
        dispatch({ name: "ADD_ONE_OBS", value: result });
      });
  };
  const removeObservation = () => {
    if (state.n > 1)
      pvalueWorker
        .removeOneObs({ data: data, M0: M0, M1: M1, SD: SD, xAxis: xAxis })
        .then((result) => {
          dispatch({ name: "REMOVE_ONE_OBS", value: result });
        });
  };
  const addObservationsPhack = (add = 1) => {
    pvalueWorker
      .addOneObs({ data: data, M0: M0, M1: M1, SD: SD, pHack: true, xAxis: xAxis })
      .then((result) => {
        dispatch({ name: "PHACK", value: result });
      });
  };
  const toggleAxis = () => {
    dispatch({ name: "SWITCH_AXIS", value: "" });
  };
  const clear = () => {
    dispatch({ name: "CLEAR", value: "" });
  };
  return (
    <Draggable handle="#handle">
      <Card
        className={classes.root}
        style={{
          position: "absolute",
          top: mobile ? "100px" : "0px",
          right: "0px",
        }}
      >
        <Typography
          variant="body2"
          align="right"
          color="textSecondary"
          id="handle"
          style={{ paddingRight: "1em", cursor: "move" }}
        >
          Drag
        </Typography>
        <CardContent>
          <Typography variant="body2" color="textPrimary">
            Observations per sample
          </Typography>
          <IconButton
            onClick={removeObservation}
            disabled={state.n < 2}
            aria-label="remove 1 observation to each sample"
            component="span"
            color="primary"
            disabled={state.phacked || state.n === 1}
          >
            <RemoveIcon />
          </IconButton>
          <Chip className={classes.nLabel} label={"n=" + state.n} />
          <IconButton
            onClick={addObservation}
            color="primary"
            aria-label="add 1 observation to each sample"
            component="span"
            disabled={state.phacked}
          >
            <AddIcon />
          </IconButton>
          <Button
            variant="contained"
            size="small"
            color={state.phacked ? "primary" : "default"}
            disableElevation
            onClick={addObservationsPhack}
          >
            p Hack
          </Button>

          <Typography variant="body2" color="textPrimary">
            Draw samples
          </Typography>
          <ButtonGroup
            disableElevation
            variant="contained"
            color="primary"
            fullWidth={true}
            disabled={state.phacked}
          >
            <Button onClick={() => addSample(1)}>+1</Button>
            <Button onClick={() => addSample(50)}>+50</Button>
            <Button onClick={() => addSample(500)}>+500</Button>
          </ButtonGroup>
          <Grid container justify="flex-end" alignItems="center">
            <Typography align="right" component="p" variant="body2">
              # Draws: {state.data.length}
            </Typography>
            <Button
              variant={state.phacked ? "contained" : "text"}
              className={classes.clearButton}
              size="small"
              color="secondary"
              disableElevation
              onClick={clear}
            >
              Clear
            </Button>
          </Grid>
          <Divider style={{ marginTop: "5px", marginBottom: "5px" }} />
          <MemoXAxisMenu
            dispatch={dispatch}
            xAxis={state.xAxis}
            data={state.data}
            shift={state.shift}
            dataBeforePhack={state.dataBeforePhack}
            phacked={state.phacked}
            M0={state.M0}
            SD={state.SD}
          />
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
          <CardContent style={{ paddingTop: 0 }}>
            <SampleStatsText
              data={state.data}
              cohend={state.cohend}
              critValLwr={state.critValLwr}
              critValUpr={state.critValUpr}
              M0={state.M0}
              SD={state.SD}
              n={state.n}
              shift={state.shift}
            />
          </CardContent>
        </Collapse>
      </Card>
    </Draggable>
  );
}
