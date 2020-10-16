---
title: Introducing 'powerlmm' an R package for power calculations for longitudinal multilevel models
date: 2017-08-24 17:30
author: Kristoffer Magnusson
output: md_document
category: R
tags: 
   - Power analysis
   - R package
   - powerlmm
   - Statistics
   - Longitudinal
   - Multilevel 
   - Linear mixed-effects model
   - lme4
slug: introducing-powerlmm
summary: Over the summer I've been working on finishing my new R package 'powerlmm', which is now almost complete. It provides flexible power calculations for typical two- and three-level longitudinal linear mixed models, with unbalanced treatment groups and cluster sizes, as well as with missing data and random slopes at both the subject and cluster-level. 
---

Over the years I've produced quite a lot of code for power calculations and simulations of different longitudinal linear mixed models. Over the summer I bundled together these calculations for the designs I most typically encounter into an R package. The purpose of `powerlmm` is to help design longitudinal treatment studies, with or without higher-level clustering (e.g. by therapists, groups, or physician), and missing data. Currently, `powerlmm` supports two-level models, nested three-level models, and partially nested models. Additionally, unbalanced designs and missing data can be accounted for in the calculations. Power is calculated analytically, but simulation methods are also provided in order to evaluated bias, type 1 error, and the consequences of model misspecification. For novice R users, the basic functionality is also provided as a Shiny web application. 

The package can be install from CRAN: [http://cran.r-project.org/package=powerlmm](http://cran.r-project.org/package=powerlmm), or GitHub  [github.com/rpsychologist/powerlmm](http://github.com/rpsychologist/powerlmm). Currently, the packages includes three vignettes that show how to setup your studies and calculate power. 


```r
# CRAN
install.packages("powerlmm")

# GitHub
devtools::install_github("rpsychologist/powerlmm", build_vignettes = TRUE)
```

# A basic example

```r
library(powerlmm)
# dropout per treatment group
d <- per_treatment(control = dropout_weibull(0.3, 2),
              treatment = dropout_weibull(0.2, 2))

# Setup design
p <- study_parameters(n1 = 11, # time points
                      n2 = 10, # subjects per cluster
                      n3 = 5, # clusters per treatment arm
                      icc_pre_subject = 0.5,
                      icc_pre_cluster = 0,
                      icc_slope = 0.05,
                      var_ratio = 0.02,
                      dropout = d,
                      cohend = -0.8)

# Power
get_power(p)
```

```
## 
##      Power calculation for longitudinal linear mixed model (three-level)
##                            with missing data and unbalanced designs 
## 
##               n1 = 11
##               n2 = 10  (treatment)
##                    10  (control)
##               n3 = 5   (treatment)
##                    5   (control)
##                    10  (total)
##          total_n = 50  (treatment)
##                    50  (control)
##                    100 (total)
##          dropout =  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10 (time)
##                     0,  0,  1,  3,  6,  9, 12, 16, 20, 25, 30 (%, control)
##                     0,  0,  1,  2,  4,  5,  8, 10, 13, 17, 20 (%, treatment)
## icc_pre_subjects = 0.5
## icc_pre_clusters = 0
##        icc_slope = 0.05
##        var_ratio = 0.02
##           cohend = -0.8
##            power = 0.68
```


# Feedback
I appreciate all types of feedback, e.g. typos, bugs, inconsistencies, feature requests, etc. Open an issue on [github.com/rpsychologist/powerlmm/issues](http://github.com/rpsychologist/powerlmm/issues) or via my contact info [here](http://rpsychologist.com/about).

