library(tidyverse)
library(JM)

p <- study_parameters(n1 = 11,
    n2 = 150,
    icc_pre_subject = 0.6,
    fixed_slope = -0.48,
    var_ratio = 0.02,
    cor_subject = -0.5,
    effect_size = cohend(-0.2))


# ---- add-MNAR
add_MNAR_missing <- function(data) {
    # Slope dependent MNAR
    d <- data
    sd2 <- 1.414214
    u1 <- d$subject_slope
    tx <- d$treatment
    p_miss <- plogis(-sd2 + qlogis(0.15) + u1 * 1) * (tx == 1) + plogis(-sd2 + qlogis(0.15) + u1 * -1) * (tx == 0)
    d[, "p_miss"] <- p_miss
    d[d$time == 0, "p_miss"] <- 0
    d$miss <- rbinom(nrow(d), 1, d$p_miss)
    for (i in unique(d$subject)) {
        tmp <- d[d$subject == i, ]
        dropout <- which(tmp$miss == 1)[1]
        if (!is.na(dropout)) tmp[dropout:nrow(tmp), "y"] <- NA
        d[d$subject == i, "y"] <- tmp$y
        d$pre[d$subject == i] <- tmp$y[1]
    }
    d <- dplyr::group_by(d, subject)
    d <- dplyr::mutate(d,
        dropout = ifelse(any(miss == 1), 1, 0),
        dropout = factor(dropout),
        treatment = factor(treatment))

    d
}