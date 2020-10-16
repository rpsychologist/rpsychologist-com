---
title: "Power analysis for longitudinal multilevel models: powerlmm 0.3.0 is now out on CRAN"
date: 2018-04-17 22:38
author: Kristoffer Magnusson
output: md_document
category: R
tags: 
- Power analysis
- powerlmm
- Statistics
- Longitudinal
- Multilevel
- Linear mixed-effects model
- lme4
slug: powerlmm-0-3-0
summary: My R package 'powerlmm' has now been update to version 0.3.0. It adds support for a more flexible effect size specifiation.
---

My R package **powerlmm** 0.3.0 is now out on CRAN. It can be installed from CRAN [https://cran.r-project.org/package=powerlmm](https://cran.r-project.org/package=powerlmm) or GitHub [https://github.com/rpsychologist/powerlmm](https://github.com/rpsychologist/powerlmm).


## New features
This version adds support for raw effect sizes, and new standardized effect sizes using the function `cohend(...)`. Here's an example that use the different types. 


```r
p <- study_parameters(n1 = 11,
						n2 = 25,
						icc_pre_subject = 0.5,
						var_ratio = 0.03,
						effect_size = c(10, # raw
										cohend(0.5, standardizer = "pretest_SD"),
										cohend(0.5, standardizer = "posttest_SD"),
										cohend(0.5, standardizer = "slope_SD"))
						)
```

## Other changes
* Support for lmerTest 3.0.