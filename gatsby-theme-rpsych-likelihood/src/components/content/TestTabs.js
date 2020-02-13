import React, { useContext, useState, useMemo } from "react";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import { chisquare, normal } from "jstat";
import { format } from "d3-format";
import katex from "katex";
import { VizDispatch } from "../../App";

const f2n = format(".2n");
const f3n = format(".3n");

const WaldPanel = React.memo(({sigma, muHat, muNull, n}) => {
  const classes = useStyles();
  const se = sigma / Math.sqrt(n);
  const waldZ = (muHat - muNull) / se;
  const pvalZ = 2 * (1 - normal.cdf(Math.abs(waldZ), 0, 1));

  const eqSE = katex.renderToString(
    `\\text{se}(\\hat\\mu) = I(\\hat\\mu, \\hat\\sigma^2)^{-1/2}`,
    {
      displayMode: false,
      throwOnError: false
    }
  )

  const eqWald = katex.renderToString(`
    \\begin{aligned}
    Z =& \\frac{\\hat\\mu - \\mu_0}{\\text{se}(\\hat\\mu)} \\\\
      =& \\frac{${f3n(muHat)} - ${f3n(muNull)}}{${f3n(se)}} \\\\
      =& ${f3n(waldZ)}
    \\end{aligned}
  `, {
    displayMode: true,
    throwOnError: false
  })

  return (
    <TabPanel className={classes.panel}>
      <Typography variant="body1">
        The Wald test is based on the difference between the maximum
        likelihood estimate of the mean and μ0 divided by the standard error
        of the MLE, <span dangerouslySetInnerHTML={{ __html: eqSE }} />
      </Typography>
      <Typography
        variant="body1"
        dangerouslySetInnerHTML={{ __html: eqWald }}
      />
      <Typography variant="body1">
        Asymptotically <em>Z</em> follow a standard normal distribution,
        giving <em>p</em> = {format(".2f")(pvalZ)}.
      </Typography>
    </TabPanel>
  )
})

const ScorePanel = React.memo(({derivMuNull, deriv2MuNull, eqChisq}) => {
  const classes = useStyles()
  const score = (derivMuNull * derivMuNull) / -deriv2MuNull;
  const eqScore = katex.renderToString(
    `
    \\begin{aligned}
    S(\\mu_0, \\hat\\sigma_0^2) =& \\frac{U(\\mu_0, \\hat\\sigma_0^2)^2}{I(\\mu_0, \\hat\\sigma_0^2)} \\\\
    &= \\frac{${f2n(derivMuNull)}^2}{${f2n(-deriv2MuNull)}} \\\\
    &= ${f3n(score)}
    \\end{aligned}
    `,
    {
      displayMode: true,
      throwOnError: false
    }
  );
  const pvalScore = 1 - chisquare.cdf(score, 1);
  return (
    <TabPanel className={classes.panel}>
      <Typography variant="body1">
        The Score test (also known as the Lagrange multiplier test) is
        slightly different in the sense that we only evaluated it at the null.
        It involves both the first and second derivative evaluated at the
        null.
      </Typography>
      <Typography
        variant="body1"
        dangerouslySetInnerHTML={{ __html: eqScore }}
      />
      <Typography variant="body1">
        Asymptotically <em>S</em> follow a{" "}
        <span dangerouslySetInnerHTML={{ __html: eqChisq }} /> distribution
        with 1 degrees of freedom, which gives <em>p</em> ={" "}
        {format(".2f")(pvalScore)}.
      </Typography>
    </TabPanel>
  )
})

const LrtPanel = React.memo(({sigma, sigma0, n, eqChisq}) => {
  const classes = useStyles()
  const calcLR = (sigma, sigma0, n) => {
    const W = Math.pow((sigma0 * sigma0) / (sigma * sigma), -n / 2);
    return -2 * Math.log(W);
  };
  const LR = calcLR(sigma, sigma0, n);
  const LRFormat = format(".3n")(LR);
  const eqLogLik = katex.renderToString(
    `\\begin{aligned}
      \\text{LR} &= -2[\\ell(\\mu_{0}, \\hat\\sigma^2_{0}) - [\\ell(\\hat\\mu, \\hat\\sigma^2)]\\\\
      &= ${LRFormat}
      \\end{aligned}`,
    {
      displayMode: true,
      throwOnError: false
    }
  );
  const pvalLRT = format(".2f")(1 - chisquare.cdf(LR, 1));
  return (
    <TabPanel className={classes.panel}>
      <Typography variant="body1">
        The likelihood ratio test compares the likelihood ratios of two
        models. In this example {"it's"} the likelihood evaluated at the MLE and
        at the null. This is illustrated in the plot by the vertical
        distance between the two horizontal lines. If we multiply the
        difference in log-likelihood by -2 we get the statistic,
      </Typography>
      <Typography
        variant="body1"
        dangerouslySetInnerHTML={{ __html: eqLogLik }}
      />
      <Typography variant="body1">
        Asymptotically LR follow a
        <span dangerouslySetInnerHTML={{ __html: eqChisq }} /> distribution
        with 1 degrees of freedom, which gives <em>p</em> = {pvalLRT}.
      </Typography>
      <Typography variant="body1">
        Note: The figure is simplified and do not account for the fact that
        each likelihood is based on different variance estimates.
      </Typography>
    </TabPanel>
  )
})

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`wrapped-tabpanel-${index}`}
      aria-labelledby={`wrapped-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </Typography>
  );
}

const TestTabs = withStyles({
  root: {
    borderBottom: "1px solid #e8e8e8",
    backgroundColor: "#ccdae3"
  },
  indicator: {
    backgroundColor: "#0984e3"
  }
})(Tabs);

const useStyles = makeStyles(() => ({
  root: {
    flexGrow: 1
  },
  panel: {
    backgroundColor: "#f1f7f9",
    color: "#425358"
  }
}));
const TestTab = withStyles(theme => ({
  root: {
    textTransform: "none",
    minWidth: 72,
    fontWeight: theme.typography.fontWeightRegular,
    fontSize: theme.typography.pxToRem(15),
    marginRight: theme.spacing(4),
    "&:hover": {
      color: "#40a9ff",
      opacity: 1
    },
    "&$selected": {
      color: "#0984e3",
      fontWeight: "700"
    },
    "&:focus": {
      color: "#0984e3"
    }
  },
  selected: {}
}))(props => <Tab {...props} />);
function a11yProps(index) {
  return {
    id: `wrapped-tab-${index}`,
    "aria-controls": `wrapped-tabpanel-${index}`
  };
}

export default function TabsWrappedLabel({
  muNull,
  muHat,
  sigma,
  sigma0,
  n,
  derivMuNull,
  deriv2MuNull
}) {
  const classes = useStyles();
  const [value, setValue] = useState("LRT");
  const dispatch = useContext(VizDispatch);

  const handleChange = (event, newVal) => {
    setValue(newVal);
    dispatch({ name: "test", value: newVal });
  };

  const eqHypo = katex.renderToString(
    `H_0: \\mu = ${muNull} \\quad \\text{versus} \\quad H_1: \\mu \\ne ${muNull}`,
    {
      displayMode: true,
      throwOnError: false
    }
  );

  const eqChisq = useMemo(() => katex.renderToString("\\chi^2", {
    displayMode: false,
    throwOnError: false
  }), [])

  return (
    <div className={classes.root}>
      <p>We have the following null and alternative hypothesis,</p>
      <p dangerouslySetInnerHTML={{ __html: eqHypo }}></p>
      <TestTabs value={value} onChange={handleChange} aria-label="test type">
        <TestTab value="LRT" label="LRT" wrapped {...a11yProps("LRT")} />
        <TestTab value="wald" label="Wald" {...a11yProps("wald")} />
        <TestTab value="score" label="Score Test" {...a11yProps("score")} />
      </TestTabs>
      {value === 'LRT' && (
        <LrtPanel
          sigma={sigma}
          sigma0={sigma0}
          n={n}
          eqChisq={eqChisq}
        />
      )}
      {value === 'wald' && (
        <WaldPanel
          n={n}
          sigma={sigma}
          muNull={muNull}
          muHat={muHat}
        />
      )}
      {value === 'score' && (
        <ScorePanel
          derivMuNull={derivMuNull}
          deriv2MuNull={deriv2MuNull}
          eqChisq={eqChisq}
        />
      )}
    </div>
  );
}
