---
title: Visualizing a One-Way ANOVA using D3.js
date: 2013-05-31 17:06
author: Kristoffer Magnusson
category: D3.js
tags: 
  - D3.js
  - JavaScript
  - R
  - Statistics
slug: d3-one-way-anova
summary: A while ago I was playing around with the javascript package D3.js, and I began with this visualization—that I never really finished—of how a one-way ANOVA is calculated. I tried to make it look like a plot from ggplot2 except with interactive elements. Take a look at it after the jump
---

A while ago I was playing around with the JavaScript package [D3.js][],
and I began with this visualization—that I never really finished—of how
a one-way ANOVA is calculated. I wanted to make the visualization
interactive, and I did integrate some interactive elements. For
instance, if you hover over a data point it will show the residual, and
its value will be highlighted in the combined computation. The circle
diagram show the partitioning of the sums of squares, and if you hover a
part it will show from where the variation is coming. I tried to make
the plots look like plots from the R-package ggplot2.

*These plots are not designed to work on mobile phones.*  

[View it here](https://rpsychologist.com/d3/one-way-ANOVA/)

Let's check the calculations in R
---------------------------------

To se if this works, let's compute the ANOVA as I have described it
here. 

```r
# data  
grp1 <- c(1,2,3,4)  
grp2 <- c(5,6,7,8)  
grp3 <- c(9,10,11,12)
```
```r
# total SS  
total_SS <- sum((c(grp1, grp2, grp3) - mean(c(grp1, grp2, grp3)))\^2)  
total_SS  
```

```rout
[1] 143
```
```r
# within groups SS  
within_SS <- sum((c(grp1 - mean(grp1), grp2 - mean(grp2), grp3 - mean(grp3)))\^2)  
within_SS
```  
```rout 
# within groups SS  
within_SS <- sum((c(grp1 - mean(grp1), grp2 - mean(grp2), grp3 - mean(grp3)))\^2)  
within_SS
```  
```rout
[1] 15
```

```r
# between groups  
between_SS <- 4*(sum((c(mean(grp1), mean(grp2), mean(grp3))^2 - mean(df$y)^2)))  
between_SS  
```
```rout
[1] 128
```

```r
# check calculation  
between_SS + within_SS == total_SS  

[1] TRUE
```

We see that *total_SS*, *between_SS* and *within_SS* are identical to
what is shown above in the visualization.  

```r
df1 <- 3-1 # number of groups - 1  
df2 <- 12 - 3 # N - number of groups  
F <- (between_SS/df1) / (within_SS/df2)  
F
```

```rout
[1] 38.4
```

```r 
1-pf(F, df1, df2) # p-value  
```
```rout
[1] 3.921015e-05
```

Let's compare this to `anova()`  

```r
df <- data.frame(y=c(grp1,grp2,grp3))  
df$group <- gl(3,4)  
anova(lm(y ~ group, df))  
```

<pre>
Analysis of Variance Table

Response: y
          Df Sum Sq Mean Sq F value    Pr(>F)    
group      2    128  64.000    38.4 3.921e-05 ***
Residuals  9     15   1.667                      
---
Signif. codes:  0 ‘***’ 0.001 ‘**’ 0.01 ‘*’ 0.05 ‘.’ 0.1 ‘ ’ 1
</pre>

We have identical results.

  [D3.js]: http://d3js.org
