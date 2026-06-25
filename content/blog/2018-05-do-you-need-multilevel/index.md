---
title: Do you really need a multilevel model? A preview of powerlmm 0.4.0
date: 2018-05-04 14:55
author: Kristoffer Magnusson
output: md_document
category: R
thumbnail: img/do-you-need-multilevel/do-you-need-multilevel-powerlmm.png
tags: 
- Power analysis
- Simulation
- R package
- Statistics
- Longitudinal 
- Multilevel
- Linear mixed-effects model
- lme4
slug: do-you-need-multilevel-powerlmm-0-4-0
summary: The next version of powerlmm (0.4.0) will soon be released, besides bug fixes this version also includes several new simulation features. In this post I will show two examples that cover the major new features.
---


In this post I will show some of the new simulation features that will be available in `powerlmm 0.4.0`. You can already install the dev version from GitHub.

```r
# GitHub
devtools::install_github("rpsychologist/powerlmm")
```

The revamped simulation functions offer 3 major new features:

* Compare multiple model formulas, including OLS models (no random effects).
* Evaluate a "forward" or "backward" model selection strategy using LRT.
* Apply a data transformation during the simulation, this makes it possible to compare e.g. an ANCOVA versus a 2-level LMM, or write your own custom MNAR or MAR missing data function.

I will cover these new function in two examples.


```r
library(powerlmm)
nsim <- 5000
cores <- 16
```

## Example 1
### Do I really need a LMM? 2-lvl LMM versus ANCOVA

This example will show both the new `data_transform` argument and the new support for multiple formulas, and formulas without random effects. Each formula is fit to the same data set (or a transformed version) during the simulation. Let's assume we'll do a trial where we measure patients for 11 weeks, from baseline to week 10. We can analyze such data in many ways, as an example we will compare 3 popular models:

* t-test: group differences at posttest
* ANCOVA: group differences at posttest adjusting for pretest values 
* LMM: group differences in change over time using a 2-level linear-mixed effects model with a random intercept and slope

To make the LMM more similar to the ANCOVA we also fit a constrained model where we assume there is no group differences at baseline (which there isn't). Let's setup the models and run the simulation, we will try different amounts of random slope variance compared to the within-subjects variance (`var_ratio`), and with or without dropout (30 % at posttest). 


```r
p <- study_parameters(n1 = 11,
                      n2 = 40, # per treatment
                      icc_pre_subject = 0.5,
                      cor_subject = -0.5,
                      var_ratio = c(0, 0.01, 0.02, 0.03),
                      dropout = c(0, dropout_weibull(0.3, 1)),
                      effect_size = cohend(c(0, 0.8)))

# Formulas --------------------------------------------------------------------
# OLS (t-test)
f_PT <- sim_formula("y ~ treatment",
                    test = "treatment",
                    data_transform = transform_to_posttest)

# ANCOVA
f_PT_pre <- sim_formula("y ~ treatment + pretest",
                        test = "treatment",
                        data_transform = transform_to_posttest)

# analyze as 2-level longitudinal
f_LMM <- sim_formula("y ~ time * treatment +
                         (1 + time | subject)")

# constrain treatment differences at pretest
f_LMM_c <- sim_formula("y ~ time + time:treatment +
                         (1 + time | subject)")

# combine formulas
f <- sim_formula_compare("posttest" = f_PT,
                         "ANCOVA" = f_PT_pre,
                         "LMM" = f_LMM,
                         "LMM_c" = f_LMM_c)

# Run sim --------------------------------------------------------------------
res <- simulate(p,
                formula = f,
                nsim = nsim,
                cores = cores,
                satterthwaite = TRUE,
                batch_progress = FALSE)
```

Let's summarize the results for the treatment effect.


```r
# need to specify what parameter estimates the treatment effect.
tests <-  list("posttest" = "treatment",
               "ANCOVA" = "treatment",
               "LMM" = "time:treatment",
               "LMM_c" = "time:treatment")

x <- summary(res, para = tests)

# Only print the first 5 
print(head(x, 5), 
      add_cols = c("var_ratio"))
```

```
## Model: 'All' | Type: 'fixed' | Parameter(s): 'treatment', 'time:treatment'
## ---
##   model var_ratio   M_est theta M_se SD_est Power Power_bw Power_satt
##  ANCOVA      0.00 -0.0441     0  2.7    2.7 0.053    0.049      0.049
##  ANCOVA      0.01  0.0083     0  3.1    3.1 0.052    0.048      0.048
##  ANCOVA      0.02  0.0153     0  3.6    3.5 0.051    0.046      0.046
##  ANCOVA      0.03 -0.0822     0  4.0    4.0 0.047    0.043      0.043
##  ANCOVA      0.00 11.3523     0  2.7    2.8 0.982    0.981      0.981
## ---
## nsim:  5000 | 24 columns not shown
```

Since we have 16 × 4 model results, it is probably better to plot the results.


```r
library(ggplot2)
library(viridis)

# re-order
x$model <- factor(x$model, levels = c("posttest",
                                      "ANCOVA", 
                                      "LMM", 
                                      "LMM_c")) 
# Set custom limits per facet
d_limits <- data.frame(effect_size = c(0), 
                       Power_satt = c(0.025, 0.075),
                       var_ratio = 0, 
                       model = 0,
                       dropout = 0)

# Set hlines per facet
d_hline <- data.frame(effect_size = c(0, 0.8), 
                      x = c(0.05, 0.8))

# Plot
ggplot(x, aes(model, 
               Power_satt,
               group = interaction(var_ratio, dropout), 
               color = factor(var_ratio),
               linetype = factor(dropout))) + 
    geom_hline(data = d_hline,  aes(yintercept = x), linetype = "dotted") +
    geom_point() + 
    geom_blank(data = d_limits) +
    geom_line() +
    labs(y = "Power (Satterthwaite)",
         linetype = "Dropout",
         color = "Variance ratio",
         title = "Power and Type I error") +
    facet_grid(dropout ~ effect_size, 
               scales = "free", 
               labeller = "label_both") +
    coord_flip() +
    theme_minimal() +
    scale_color_viridis_d()
```

![](img/unnamed-chunk-6-1.png)

We can see that for complete data ANCOVA is generally more powerful than the standard LMM as heterogeneity increases ("variance ratio"), whereas the constrained LMM is even more powerful. The difference between ANCOVA and t-test ("posttest") also decrease with increasing heterogeneity in change over time—since this leads to a weaker correlation between pretest and posttest. For the scenarios with missing data, LMM is more powerful, as would be expected—the cross-sectional methods have 30 % of the observations missing, whereas the LMMs can include the available responses up until dropout occurs. 

It is worth noting that the 2-lvl LMM with 11 repeated measures is not always more powerful than a "cross-sectional" t-test at posttest. Obviously, this is a limited example, but it demonstrates that it is a mistake to base sample size calculations on a t-test, when a LMM is planned, with the motivation that "a LMM will have more power" (I see such motivations quite often). 

## Example 2
### Do I really need a multilevel model? Using LRT to perform model selection 
A common strategy when analyzing (longitudinal) data is to build the model in a data driven fashion—by starting with a random intercept model, then add a random slope and perform a likelihood ratio test (LRT) and keep the random slope if it is significant, and so on. We can investigate how well such a strategy works using `sim_formula_compare`. We'll define our model formulas, starting with a 2-level random intercept model and working up to a 3-level random intercept and slope model. The true model is a 3-level model with only a random slope. Let's first setup the models

```r
p <- study_parameters(n1 = 11,
                      n2 = 40,
                      n3 = 3,
                      icc_pre_subject = 0.5,
                      cor_subject = -0.5,
                      icc_slope = 0.05,
                      var_ratio = 0.03)

f0 <- sim_formula("y ~ time * treatment + (1 | subject)")
f1 <- sim_formula("y ~ time * treatment + (1 + time | subject)")
f2 <- sim_formula("y ~ time * treatment + (1 + time | subject) + (0 + time | cluster)")
f3 <- sim_formula("y ~ time * treatment + (1 + time | subject) + (1 + time | cluster)")

f <- sim_formula_compare("subject-intercept" = f0, 
                         "subject-slope" = f1, 
                         "cluster-slope" = f2,
                         "cluster-intercept" = f3)
```

Then we run the simulation, the four model formulas in `f` will be fit the each data set.


```r
res <- simulate(p, formula = f, 
                nsim = nsim, 
                satterthwaite = TRUE, 
                cores = cores,
                CI = FALSE)
```

During each simulation the REML log-likelihood is saved for each model, we can therefore perform the model selection in the summary method, as a post-processing step. Since REML is used it is assumed the fixed effects are the same, and that we compare a "full model" to a "reduced model". Let's try a forward selection strategy, where start with the first model and compare it to the next. If the comparison is significant we continue testing models, else we stop. The summary function performs this model comparison for each of the `nsim` simulations and returns the results from the "winning" model in each simulation replication.


```r
x <- summary(res, model_selection = "FW", LRT_alpha = 0.05)
x
```

```
## Model:  model_selection 
## 
## Random effects 
## 
##          parameter   M_est  theta est_rel_bias prop_zero is_NA
##  subject_intercept 100.000 100.00      0.00029      0.00     0
##      subject_slope   2.900   2.80      0.00710      0.00     0
##              error 100.000 100.00     -0.00017      0.00     0
##        cor_subject  -0.490  -0.50     -0.01000      0.00     0
##      cluster_slope   0.270   0.15      0.82000      0.00     0
##  cluster_intercept   7.900   0.00      7.90000      0.00     0
##        cor_cluster  -0.081   0.00     -0.08100      0.67     0
## 
## Fixed effects 
## 
##       parameter   M_est theta M_se SD_est Power Power_bw Power_satt
##     (Intercept)  0.0160     0 1.10   1.00 0.050        .          .
##            time -0.0045     0 0.25   0.28 0.130        .          .
##       treatment  0.0160     0 1.50   1.50 0.049        .          .
##  time:treatment -0.0024     0 0.36   0.40 0.130    0.048       0.12
## ---
## Number of simulations: 5000  | alpha:  0.05
## Time points (n1):  11
## Subjects per cluster (n2 x n3):  40 x 3 (treatment)
##                                  40 x 3 (control)
## Total number of subjects:  240 
## ---
## Results based on LRT model comparisons, using direction: FW (alpha = 0.05)
## Model selected (proportion)
## cluster-intercept     cluster-slope     subject-slope 
##            0.0054            0.4360            0.5586
```

The point of the model selection algorithm is to mimic a type of data driven model selection that is quite common. We see that this strategy do not lead to nominal Type I errors in this scenario. The cluster-level is left out of the model too often, leading to Type I errors around 12 %. However, it is fairly common to increase the LRT's alpha level to try to improve this strategy. Let's try a range of alpha level to see the impact.


```r
alphas <- seq(0.01, 0.5, length.out = 50)
x <- vapply(alphas, function(a) {
    type1 <- summary(res, model_selection = "FW", LRT_alpha = a)
    type1$summary$model_selection$FE$Power_satt[4]
    }, numeric(1))
d <- data.frame(LRT_alpha = alphas, type1 = x)
```


```r
d <- data.frame(LRT_alpha = alphas, type1 = x)
ggplot(d, aes(LRT_alpha, type1)) + 
    geom_line() +
    geom_hline(yintercept = 0.05, linetype = "dotted") +
    labs(y = "Type I error (time:treatment)",
         title = "Impact of LRT alpha level for model selection") +
    theme_minimal()
```

![](./img/unnamed-chunk-11-1.png)

The figure shows that the LRT alpha level need to be very liberal to keep Type I errors, for the treatment effect, close to the 5 % level. 

We can also see the results from each of the four models. Here we will just look at the `time:treatment` effect.


```r
x1 <- summary(res, para = "time:treatment")
x1
```

```
## Model:  summary 
## 
## Fixed effects: 'time:treatment'
## 
##              model   M_est theta M_se SD_est Power Power_bw Power_satt
##  subject-intercept -0.0024     0 0.14    0.4 0.500    0.330      0.500
##      subject-slope -0.0024     0 0.25    0.4 0.220    0.080      0.220
##      cluster-slope -0.0024     0 0.39    0.4 0.088    0.028      0.054
##  cluster-intercept -0.0024     0 0.40    0.4 0.082    0.026      0.043
## ---
## Number of simulations: 5000  | alpha:  0.05
## Time points (n1):  11
## Subjects per cluster (n2 x n3):  40 x 3 (treatment)
##                                  40 x 3 (control)
## Total number of subjects:  240
```

We see that the 2-lvl random intercept model lead to substantially inflated Type I errors = 0.495. The 2-level model that also adds a random slope is somewhat better but still not good, Type I errors = 0.215. The correct 3-level model that account for the third level using a random slope have close to nominal Type I errors = 0.054. The full 3-level that adds an unnecessary random intercept is somewhat conservative, Type I errors = 0.043.  

When choosing a strategy Type I errors is not only factor we want to minimize, power is also important. So let's see how power is affected.


```r
# See if power is impacted
p1 <- update(p, effect_size = cohend(0.8))
res_power <- simulate(p1, 
                      formula = f, 
                      nsim = nsim, 
                      satterthwaite = TRUE,
                      cores = cores, 
                      CI = FALSE)
```


```r
# we can also summary a fixed effect for convenience
x <- summary(res_power, 
             model_selection = "FW", 
             LRT_alpha = 0.05,
             para = "time:treatment")
print(x, verbose = FALSE)
```

```
## Model:  summary 
## 
## Fixed effects: 'time:treatment'
## 
##            model M_est theta M_se SD_est Power Power_bw Power_satt
##  model_selection   1.1   1.1 0.36   0.39  0.82     0.61       0.69
## ---
```

```r
x1 <- summary(res_power, 
              para = "time:treatment")
print(x1, verbose = FALSE)
```

```
## Model:  summary 
## 
## Fixed effects: 'time:treatment'
## 
##              model M_est theta M_se SD_est Power Power_bw Power_satt
##  subject-intercept   1.1   1.1 0.14   0.39  0.98     0.97       0.98
##      subject-slope   1.1   1.1 0.25   0.39  0.95     0.86       0.94
##      cluster-slope   1.1   1.1 0.39   0.39  0.80     0.55       0.63
##  cluster-intercept   1.1   1.1 0.40   0.39  0.78     0.52       0.55
## ---
```


We can note that power for the treatment effect based on LRT model selection is only slightly higher than for the correct 3-level model. If we balance this slight increase in power compared to the noticeable increase in Type I errors, it might be reasonable to conclude that for these data we should always fit the 3-level model. Lastly, the overspecified 3-level model that include an unnecessary random intercept loses some power.

# Summary
The improved simulation method in `powerlmm` makes it really convenient to plan and evaluate the analysis of longitudinal treatment trials with a possible third level of clustering (therapists, schools, groups, etc). The support for data transforms and single level (`lm()`) models also enables a lot of custom models to be fit. 

# Feedback, bugs, etc
I appreciate all types of feedback, e.g. typos, bugs, inconsistencies, feature requests, etc. Open an issue on [github.com/rpsychologist/powerlmm/issues](http://github.com/rpsychologist/powerlmm/issues), common on this post, or contact me here [rpsychologist.com/about](http://rpsychologist.com/about).

