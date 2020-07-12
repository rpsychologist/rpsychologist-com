import React, { useContext, useState, useCallback } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Collapse from "@material-ui/core/Collapse";
import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import { VizDispatch } from "../../App";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import PlayCircleFilledIcon from "@material-ui/icons/PlayCircleFilled";
import ReplayIcon from "@material-ui/icons/Replay";
import InfoIcon from "@material-ui/icons/Info";
import Tooltip from "@material-ui/core/Tooltip";
import katex from "katex";

const useStyles = makeStyles(theme => ({
  formControl: {
    margin: theme.spacing(1),
    marginLeft: 0,
    minWidth: 120
  },
  selectEmpty: {
    marginTop: theme.spacing(2)
  },
  eqCard: {
    backgroundColor: "#f1f7f9",
    "& a": {
      color: "#000",
      fontWeight: "bold"
    }
  }
}));

const Controls = ({
  converged,
  count,
}) => {
  const dispatch = useContext(VizDispatch);
  const iterate = () => {
    dispatch({
      name: "algoIterate",
      value: {
        increment: 1
      }
    });
  };
  const decrement = () => {
    dispatch({
      name: "algoReverse",
      value: {}
    });
  };

  return (
    <>
      <Tooltip title={converged ? "" : "Run until convergence"}>
        <IconButton
          onClick={() =>
            dispatch({
              name: "algoRun",
              value: { delay: 1000 }
            })
          }
          aria-label="run gradient ascent"
          disabled={converged}
        >
          <PlayCircleFilledIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={converged ? "" : "1 iteration"}>
        <IconButton
          onClick={() => iterate()}
          aria-label="iterate 1 gradient ascent"
          disabled={converged}
        >
          +1
        </IconButton>
      </Tooltip>
      <Tooltip title={count == 0 ? "" : "-1 iteration"}>
        <IconButton
          onClick={() => decrement()}
          aria-label="iterate 1 gradient ascent"
          disabled={count == 0}
        >
          -1
        </IconButton>
      </Tooltip>
      <Tooltip title={!converged ? "" : "Reset"}>
        <IconButton
          onClick={() =>
            dispatch({
              name: "algoReset",
              value: null
            })
          }
          aria-label="reset gradient ascent"
          disabled={!converged}
        >
          <ReplayIcon />
        </IconButton>
      </Tooltip>
    </>
  );
};

const CardGradient = React.memo(({ toggle }) => {
  const classes = useStyles();
  const eqGrad = katex.renderToString(
    `
    \\begin{aligned}
    \\mu_{n+1} &= \\mu_n + \\gamma \\frac{\\partial}{\\partial \\mu_n}\\ell \\\\
    \\sigma^2_{n+1} &= \\sigma^2_n + \\gamma \\frac{\\partial}{\\partial \\sigma^2_n}\\ell 
    \\end{aligned}
    `,
    {
      displayMode: true,
      throwOnError: false
    }
  );
  return (
    <Card className={classes.eqCard}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Gradient Ascent
        </Typography>
        <Typography variant="body2" component="p">
          <a href="https://en.wikipedia.org/wiki/Gradient_descent">Gradient descent</a> is a simple iterative algorithm that uses the <a href="https://en.wikipedia.org/wiki/Gradient">gradient</a> (the vector of partial derivatives) to find the local minima. In our example, we
          look for the maxima, so we are doing gradient ascent. In both cases, we
          start with an initial guess for what the parameters' values are and
          iteratively update the values until convergence. Each update is
          proportional to the derivative of the log-likelihood at the current
          parameter value. This is illustrated by the slope of the tangent line
          in the plots; if you move the values to a steeper region, you can
          see that the next step will be farther away. For our simple model, we do the following iteration:
          <span dangerouslySetInnerHTML={{ __html: eqGrad }} />

          Note: I've standardized the data to make the algorithm a bit more
          efficient - the values are back-transformed before they are plotted. The step-size (γ, sometimes called "learning rate") is 0.1.
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={toggle}>
          Close
        </Button>
      </CardActions>
    </Card>
  );
});

const CardNewton = React.memo( ({ toggle }) => {
  const classes = useStyles();
  const eqNewton = katex.renderToString(
    `
    \\begin{aligned}
    \\mu_{n+1} &= \\mu_n + \\small \\frac{\\partial^2}{\\partial \\mu_n^2}\\ell^{-1} \\frac{\\partial}{\\partial \\mu_n}\\ell \\\\
    \\sigma^2_{n+1} &= \\sigma^2_n + \\small \\frac{\\partial^2}{\\partial (\\sigma_n^2)^2}\\ell^{-1}\\gamma \\frac{\\partial}{\\partial \\sigma^2_n}\\ell 
    \\end{aligned}
    `,
    {
      displayMode: true,
      throwOnError: false
    }
  );
  return (
    <Card className={classes.eqCard}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          The Newton-Raphson Method
        </Typography>
        <Typography variant="body2" component="p">
          <a href="https://en.wikipedia.org/wiki/Newton%27s_method">The Newton-Raphson method</a> (which is the same as <a href="https://en.wikipedia.org/wiki/Scoring_algorithm#Fisher_scoring">Fisher's scoring algorithm</a> in this
          example) is similar to gradient ascent except that the step length now
          also depends on the <a href="https://en.wikipedia.org/wiki/Hessian_matrix">Hessian</a> (i.e., the matrix of second-order
          partial derivates). More technically, we now make a second-order{" "}
          <a href="https://en.wikipedia.org/wiki/Taylor_series">Taylor approximation</a> around the current value and update our
          estimate to the maxima of the approximation. This is best illustrated by
          the red curve in the variance plot; the log-likelihood curve for the mean is perfectly
          approximated and not that illustrative. For our simple model
          we do the following iterating until convergence:
          <span dangerouslySetInnerHTML={{ __html: eqNewton }} />
          Note: I only illustrate the Taylor approximation in one dimension, but
          for multivariable functions (such as our chosen log-likelihood) the approximation is of course
          multidimensional. However, I do not show it on the contour plot as it would look messy, and the
          intuition would be the same.
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={toggle}>
          Close
        </Button>
      </CardActions>
    </Card>
  );
});

const GradientAscent = props => {
  const dispatch = useContext(VizDispatch);
  const { algo, count, converged } = props;
  const classes = useStyles();
  const handleChange = event => {
    dispatch({ name: "algo", value: event.target.value });
  };
  const [expanded, setExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    setExpanded(val => !val);
  }, []);

  return (
    <div>
      <Typography variant="body1" gutterBottom>
        For more challenging models, we often need to use some{" "}
        <b>optimization algorithm</b>. Basically, we let the computer
        iteratively climb towards the top of the hill. You can use the controls below
        to see how a gradient ascent or Newton-Raphson algorithm finds its way to the maximum
        likelihood estimate.
      </Typography>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        {props.algo == "gradientAscent" && (
          <CardGradient toggle={handleToggle} />
        )}
        {props.algo == "newtonRaphson" && <CardNewton toggle={handleToggle} />}
      </Collapse>
      <Grid
        container
        direction="row"
        justify="flex-start"
        alignItems="flex-end"
      >
        <FormControl className={classes.formControl}>
          <InputLabel id="demo-simple-select-filled-label">
            Algorithm
          </InputLabel>
          <Select
            labelId="demo-simple-select-filled-label"
            id="demo-simple-select-filled"
            value={algo}
            onChange={handleChange}
          >
            <MenuItem value="none">
              <em>None</em>
            </MenuItem>
            <MenuItem value={"gradientAscent"}>Gradient ascent</MenuItem>
            <MenuItem value={"newtonRaphson"}>Newton-Raphson</MenuItem>
          </Select>
        </FormControl>
        {algo != "none" && (
          <>
            <Controls {...props} />
            <Tooltip title={"More information"}>
              <IconButton onClick={handleToggle} aria-label="more-information">
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Grid>
      {algo != "none" && (
        <Typography component="p" variant="body2">
          Iterations: {count} {converged && "(converged)"}
        </Typography>
      )}
    </div>
  );
};

export default GradientAscent;
