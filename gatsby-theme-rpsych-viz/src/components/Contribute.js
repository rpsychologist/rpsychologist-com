import React from "react";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import Link from "@material-ui/core/Link";


const CoffeButton = withStyles((theme) => ({
  root: {
    textTransform: "none",
    fontWeight: "700",
    color: "white",
    backgroundColor: theme.palette.type === "light" ? "black" : "rgb(255, 129, 63)",
    "&:hover": {
      backgroundColor: theme.palette.type === "light" ? "rgb(255, 129, 63)" : "black"
    }
  }
}))(Button);

const PayPalButton = withStyles(() => ({
  root: {
    textTransform: "none",
    fontWeight: "700"
  }
}))(Button);

const Contribute = React.memo(() => {
  return (
    <div>
      <Typography variant="h3" component="h2" align="center" gutterBottom>
        Contribute/Donate
      </Typography>
      <Typography variant="body1" paragraph>
        There are many ways to contribute to free and open software. If you
        like my work and want to support it you can:
      </Typography>
      <Grid
        container
        spacing={2}
        direction="column"
        justify="center"
        alignItems="center"
      >
        <Grid item xs={12}>
          <CoffeButton
            variant="contained"
            color="primary"
            href="https://www.buymeacoffee.com/krstoffr"
            size="large"
          >
            Buy Me a Coffee
          </CoffeButton>
        </Grid>
        <Grid item xs={12}>
          <PayPalButton color="primary" href="https://www.paypal.me/krstoffr">
            (or use PayPal)
          </PayPalButton>
        </Grid>
      </Grid>
      <Typography variant="body1" paragraph style={{ marginTop: '1em' }}>
        Pull requests are also welcome, or you can contribute by suggesting new features, add useful references,
        or help fix typos. Just open a issues on{" "}
        <Link href="https://github.com/rpsychologist/rpsychologist-com">GitHub</Link>.
      </Typography>
    </div>
  );
});
export default Contribute;
