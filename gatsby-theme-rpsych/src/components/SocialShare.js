import React from "react";
import Social from "./Social";
import Typography from "@material-ui/core/Typography";
import { useTranslation } from "react-i18next"

const SocialShare = ({ slug, title }) => {
  const { t } = useTranslation("blog");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      <Typography variant="subtitle2" component="span" color="textSecondary">
        {t("Share")}
      </Typography>
      <Social slug={slug} title={title} />
    </div>
  );
};
export default SocialShare;
