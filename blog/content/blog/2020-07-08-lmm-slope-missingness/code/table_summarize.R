library(kableExtra)
library(powerlmm)
library(dplyr)
res <- readRDS("data/MNAR_sim.Rds")
res_H0 <- readRDS("data/MNAR_sim_H0.Rds")
get_cover <- function(est, se, theta, alpha = 0.05) {
        # CI cover
        lwr <- est - qnorm(1 - (alpha/2)) * se
        upr <- est + qnorm(1 - (alpha/2)) * se
        
        lwr < theta & upr > theta
        
}
sum_cover <- function(x, theta) {
        x %>% filter(!is.na(se), !is.nan(se)) %>% 
                mutate(CI_cov = get_cover(estimate, se, theta = theta)) %>% 
                summarise(CI_cov = mean(CI_cov)) %>% 
                pull(CI_cov)
}

theta <- -0.3162

# MAR
MAR_CI <- res$res$MAR$FE %>% 
        filter(parameter == "time:treatment1") %>% 
        sum_cover(theta = theta)

# GEE
GEE_CI <- res$res$PM$FE %>% 
        filter(parameter == "GEE_time:treatment1") %>% 
        sum_cover(theta = theta)

# JM
JM_CI <- res$res$PM$FE %>% 
        filter(parameter == "JM_treatment1:time",  !is.nan(se)) %>% 
        sum_cover(theta = theta)


res$res$PM$FE %>% 
        filter(parameter == "JM_treatment1:time") %>% 
        summarise(mean(is.nan(se)))


# PM
PM_CI <- res$res$PM$FE %>% 
        filter(parameter == "PM_avg_posttest") %>% 
        mutate(estimate = -estimate) %>% 
        sum_cover(theta = theta*10)



# Type I error ------------------------------------------------------------
x0 <- summary(res_H0)

MAR_typeI <- x0$summary$MAR$FE[4, 6]
PM_typeI <- x0$summary$PM$FE[9, 6]
GEE_typeI <- x0$summary$PM$FE[13, 6]
JM_typeI <- x0$summary$PM$FE[17, 6]
complete_typeI <- x0$summary$complete$FE[4, 6]


# Complete
complete_CI <- res$res$complete$FE %>% 
        filter(parameter == "time:treatment") %>% 
        sum_cover(theta = theta)

x <- summary(res)


tab <- rbind(
        x$summary$MAR$FE[4, c(1,2,6)] %>% 
              mutate(M_est = M_est * 10,
                     CI_cover = MAR_CI,
                     type_I = MAR_typeI,
                     mod = "MAR"),
      
      x$summary$PM$FE[9, c(1,2,6)] %>% 
              mutate(M_est = -M_est,
                     CI_cover = PM_CI,
                     type_I = PM_typeI,
                     mod = "PM"),
      
      x$summary$PM$FE[13, c(1,2,6)] %>% 
              mutate(M_est = M_est * 10,
                     CI_cover = GEE_CI,
                     type_I = GEE_typeI,
                     mod = "GEE"),
      x$summary$PM$FE[17, c(1,2,6)] %>% 
              mutate(M_est = M_est * 10,
                     CI_cover = JM_CI,
                     type_I = JM_typeI,
                     mod = "JM"),
      
      x$summary$complete$FE[4, c(1,2,6)] %>% 
              mutate(M_est = M_est * 10,
                     CI_cover = complete_CI,
                     type_I = complete_typeI,
                     mod = "Complete")
)

tab <- tab %>% 
        mutate(d = M_est/16,
               rel_bias = (M_est - (theta*10))/theta*10)
tab

        

# html
tab %>% 
        dplyr::select(Model = mod, 
                      `M(Est.)` = M_est, 
                      `Rel. bias` = rel_bias, 
                      d, 
                      Power,
                      `CI coverage` = CI_cover,
                      `Type I error` = type_I) %>% 
        kable(format = "html", booktabs = T, caption = "Test", digits = 2) %>%
        kable_styling() %>%
        add_footnote("Footnote 1", notation="alphabet") 
