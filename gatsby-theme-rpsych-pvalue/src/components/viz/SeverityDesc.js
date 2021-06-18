import React, { useContext } from "react";
import { SettingsContext } from "../../Viz";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import Grid from '@material-ui/core/Grid';
import { normal } from "jstat";
import { makeStyles } from "@material-ui/styles";
import { format } from "d3-format";
import MuiLink from '@material-ui/core/Link'
import Typography from "@material-ui/core/Typography";

const useStyles = makeStyles(() => ({
    formControl: {
        margin: 0,
        minWidth: 150,
      }    
  }));

const SevMenu = () => {
    const classes = useStyles();
    const { state, dispatch } = useContext(SettingsContext);
    const handleChange = (event) => {
      dispatch({ name: "SWITCH_SEV_DIRECTION", value: event.target.value });
    };
    const H1 = format(".1f")(state.M1)
  
    return (
      <FormControl className={classes.formControl}>
        <InputLabel id="select-sev-direction-label">Claim Direction</InputLabel>
        <Select
          labelId="select-sev-direction-label"
          id="select-sev-direction"
          value={state.sevDirection === null ? "less" : state.sevDirection}
          onChange={handleChange}
        >
          <MenuItem value={"less"}> {`μ < ${H1}`}</MenuItem>
          <MenuItem value={"greater"}>{`μ > ${H1}`}</MenuItem>
        </Select>
      </FormControl>
    );
  };

const SeverityDescription = (props) => {
    const { highlight,  M1, direction, SE } = props;
    const xbar = format(".1f")(highlight.M);
    const H1 = format(".1f")(M1)
    const claim = direction === "less" ? `μ < ${H1}` : `μ > ${H1}`;
    let sev = normal.cdf(highlight.M, M1, SE)
    sev = direction === "less" ? 1 - sev : sev
    return (
      <>
        <Grid container alignItems="flex-end" spacing={2}>
            <Grid item>
              <Typography variant="body1">
              <strong>Severity Assessment: </strong> SEV(T, x̄ = {xbar}, {claim}) = {format(".2r")(sev)}
              </Typography>
          </Grid>
          <Grid item xs={12}>
            <SevMenu />
          </Grid>
          <Grid item xs={12}>
          We have observed x̄ = {xbar} and want to assess the claim that {claim},
          if we assume that the sample came from a population with mean {H1}, then{" "}
          {format(".3p")(sev)} of the time we would observe a mean{" "}
          {direction === "less" ? "greater" : "less"} than x̄ = {xbar}. According
          to{" "}
          <MuiLink
            href="https://www.amazon.com/gp/product/1107664640/ref=as_li_qf_asin_il_tl?ie=UTF8&tag=rpsyc-20&creative=9325&linkCode=as2&creativeASIN=1107664640&linkId=aa85d15f7afd2fae0ca3aa4b4f7adb55"
            target="_blank"
          >
            Mayo (2018)
          </MuiLink>{" "}
          "this probability must be high for C to pass severely; if it’s low, it’s
          BENT". See{" "}
          <MuiLink
            href="https://www.amazon.com/gp/product/1107664640/ref=as_li_qf_asin_il_tl?ie=UTF8&tag=rpsyc-20&creative=9325&linkCode=as2&creativeASIN=1107664640&linkId=aa85d15f7afd2fae0ca3aa4b4f7adb55"
            target="_blank"
          >
            Statistical Inference as Severe Testing: How to Get Beyond the
            Statistics Wars
          </MuiLink>.
          </Grid>
        </Grid>
      </>
    );
  };
  


  export default SeverityDescription;