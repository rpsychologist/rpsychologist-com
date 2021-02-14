import React from "react";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Link from "@material-ui/core/Link";
import BuyMeACoffee from "./BuyMeACoffee";
import GitHubSponsors from "./GitHubSponsors"
import { useTranslation, Trans } from "react-i18next";

const Contribute = React.memo(() => {
  const { t } = useTranslation("blog");

  return (
    <div>
      <Typography variant="h3" component="h2" align="center" gutterBottom>
        {t("Contribute/Donate")}
      </Typography>
      <Typography variant="body1" paragraph>
        {t("Many ways to contribute")}
      </Typography>
      <BuyMeACoffee />
      <Typography variant="h3" component="h2" align="center" gutterBottom>
        {t("Sponsors")}
      </Typography>
      <GitHubSponsors />
      <Typography variant="body1" paragraph style={{ marginTop: "1em" }}>
        <Trans i18nKey="contributeGitHub" t={t}>
          Pull requests are also welcome, or you can contribute by suggesting
          new features, add useful references, or help fix typos. Just open a
          issues on{" "}
          <Link href="https://github.com/rpsychologist/rpsychologist-com">
            GitHub
          </Link>
          .
        </Trans>
      </Typography>
    </div>
  );
});
export default Contribute;
