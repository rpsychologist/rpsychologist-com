import React from "react";
import { Typography } from "@material-ui/core";
import { version, lastUpdated } from "gatsby-theme-rpsych-pvalue/package.json";
import Link from "@material-ui/core/Link";
import { useTranslation, Trans } from "react-i18next";

const License = () => {
  const { t } = useTranslation("cohend");
  return (
    <div>
      <Trans i18nKey="license" t={t} version={version} lastUpdated={lastUpdated}>
        Version {{version}}, last updated {{lastUpdated}}. Licenses: MIT (
        <Link href={"https://github.com/rpsychologist/rpsychologist-com/"}>
          source code
        </Link>
        ), the visualization is CC0, and the text content is CC-BY 4.0.
      </Trans>
    </div>
  );
};
export default License;
