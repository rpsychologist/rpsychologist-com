
source("code/MNAR_functions.R")

## ---- post-test
post_test <- function(fit, d = NULL) {
    # pattern mixture
    res <- emmeans::emmeans(fit,
        pairwise ~ treatment | time,
        at = list(time = 10),
        CIs = FALSE,
        lmer.df = "satterthwaite",
        weights = "proportional",
        data = d)
    out <- as.data.frame(res$contrasts)
    out_PM <- data.frame(parameter = "PM_avg_posttest",
        estimate = out$estimate,
        se = out$SE,
        pval = out$p.value,
        df = out$df,
        df_bw = NA)
    # GEE
    fit <- geepack::geeglm(y ~ time * treatment, id = subject, data = d)
    x <- summary(fit)
    out_GEE <- data.frame(parameter = paste0("GEE_", rownames(x$coefficients)),
        estimate = x$coefficients[, 1],
        se = x$coefficients[, 2],
        pval = x$coefficients[, 4],
        df = NA,
        df_bw = NA)
    # JM
    d_c <- d
    d_m <- d %>%
        filter(!is.na(y)) %>%
        arrange(subject)
    #  LMM
    fit_lme <- tryCatch(lme(y ~ treatment * time, data = d_m,
        random = ~ time | subject),
    error = function(e) NA)
    # dropouts
    d_miss <- d_m %>%
        group_by(subject, treatment) %>%
        summarise(time = max(time),
            time = ifelse(time < 10, time + 1, time),
            dropout = ifelse(time < 10, 1, 0)) %>%
        arrange(subject)
    # the Cox model
    fit_surv <- tryCatch(coxph(Surv(time, dropout) ~ treatment, data = d_miss, x = TRUE),
        error = function(e) NA)
    # the joint model
    # slope derivates
    dForm <- list(
        fixed = ~treatment,
        random = ~1,
        indFixed = c(3, 4),
        indRandom = c(2)
    )
    if (inherits(fit_lme, "lme") & inherits(fit_surv, "coxph")) {
        fit_JM <- tryCatch({
            fit <- jointModel(fit_lme, fit_surv,
                timeVar = "time",
                parameterization = "slope",
                derivForm = dForm,
                interFact = list(slope = ~treatment,
                    data = d_miss))
            summary(fit)
        }, error = function(e) NA)
    } else fit_JM <- NA
    if (inherits(fit_JM, "summary.jointModel")) {
        x <- fit_JM$`CoefTable-Long`
        out_JM <- data.frame(parameter = paste0("JM_", rownames(x)),
            estimate = x[, 1],
            se = x[, 2],
            pval = x[, 4],
            df = NA,
            df_bw = NA)
    } else {
        out_JM <- data.frame(
            parameter = paste0("JM_",
                c("(Intercept)",
                    "treatment1",
                    "time",
                    "treatment1:time")),
            estimate = NA,
            se = NA,
            pval = NA,
            df = NA,
            df_bw = NA)
    }

    rbind(out_PM,
        out_GEE,
        out_JM)
}


# ---- Simulate ----------------------------------------------------------------
cl <- parallel::makeCluster(16)
parallel::clusterEvalQ(cl, {
    library(survival)
    library(geepack)
    library(dplyr)
    library(nlme)
    library(JM)
})

f <- sim_formula("y ~  time * treatment + (1 + time | subject)",
    test = "time:treatment1",
    data_transform = add_MNAR_missing,
    family = gaussian())
f0 <- sim_formula("y ~ time * treatment + (1 + time | subject)", family = gaussian())
f1 <- sim_formula("y ~  time * treatment * dropout + (1 + time | subject)",
    test = "time:treatment1",
    data_transform = add_MNAR_missing,
    post_test = post_test,
    family = gaussian())

res <- simulate(p, formula = sim_formula_compare("MAR" = f,
    "PM" = f1,
    "complete" = f0),
    cl = cl,
    nsim = 5000, 
    cores = 16)

res_H0 <- simulate(update(p, effect_size = 0),
    formula = sim_formula_compare("MAR" = f,
        "PM" = f1,
        "complete" = f0),
    cl = cl,
    nsim = 5000, 
    cores = 16)

summary(res)
parallel::stopCluster(cl)

# Save results
saveRDS(res, "data/MNAR_sim.Rds")
saveRDS(res_H0, "data/MNAR_sim_H0.Rds")
