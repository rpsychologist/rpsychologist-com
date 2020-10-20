---
title: What are the formulas?
order: 1
---

### Cohen's *d*
Cohen's *d* is simply the standardized mean difference, 

$$ \delta = \frac{\mu_2-\mu_1}{\sigma}$$,

where $\delta$ is the population parameter of Cohen's *d*. Where it is assumed that $\sigma_1=\sigma_2=\sigma$, i.e., homogeneous population variances. And $\mu_i$ is the mean of the respective population.

### Cohen's U<sub>3</sub>
Cohen (1977) defined U<sub>3</sub> as a measure of non-overlap, where "we take the percentage of the A population which the upper half of the cases of the Β population exceeds". Cohen's *d* can be converted to Cohen's U<sub>3</sub> using the following formula

$$U_3 = \Phi(\delta)$$

where $\Phi$ is the cumulative distribution function of the standard normal distribution, and $\delta$ the population Cohen's <em>d</em>. 

### Overlap
Generally called the overlapping coefficient (OVL). Cohen's <em>d</em> can be converted to OVL using the following formula (Reiser and Faraggi, 1999)

$$\text{OVL}=2\Phi(-|\delta|/2) $$

where $\Phi$ is the cumulative distribution function of the standard normal distribution, and $\delta$ the population Cohen's *d*. 

### Probability of superiority
This is effect size with many names: common language effect size (CL), Area under the receiver operating characteristics (AUC) or just A for its non-parametric version (Ruscio & Mullen, 2012). It is meant to be more intuitive for persons without any training in statistics. The effect size gives the probability that a person picked at random from the treatment group will have a higher score than a person picked at random from the control group. Cohen's *d* can be converted CL using the following formula (Ruscio, 2008)

$$\text{CL}=\Phi\left(\frac{\delta}{\sqrt{2}}\right)$$

where $\Phi$ is the cumulative distribution function of the standard normal distribution, and $\delta$ the population Cohen's *d*. 

### Number Needed to Treat
NNT is the number of patients we would need to treat with the intervention to achieve one more favorable outcome compared to the control group. Furukawa and Leucht (2011) gives the following formula for converting Cohen's *d* into NNT

$$ \text{NNT} = \frac{1}{  \Phi(\delta + \Psi(CER))-CER}$$

where $\Phi$ is the cumulative distribution function of the standard normal distribution and \(\Psi\) its inverse, CER is the control group's event rate and \(\delta\) the population Cohen's *d*. **N.B. CER is set to 20 % in the visualization above. You can change this be pressing the settings symbol to the right of the slider**. The definition of an "event" or a "response" is arbitrary and could be defined as the proportion of patients who are in remission, e.g. bellow some cut-off on a standardized questionnaire. It is possible to convert Cohen's *d* into a version of NNT that is invariant to the event rate of the control group. The interested reader should look at Furukawa and Leucht (2011) where a convincing argument is given to why this complicates the interpretation of NNT.

### R code to calculate NNT from Cohen's *d*
Since many have asked about R code for the formula above, here it is

```r
CER <- 0.2
d <- 0.2
1 / (pnorm(d + qnorm(CER))-CER)
```

### References

* Baguley, T. (2009). Standardized or simple effect size: what should be reported? *British journal of psychology*, 100(Pt 3), 603–17.
* Cohen, J. (1977). *Statistical power analysis for the behavioral sciencies*. Routledge.
* Furukawa, T. A., & Leucht, S. (2011). How to obtain NNT from Cohen's d: comparison of two methods. *PloS one*, 6(4).
* Reiser, B., & Faraggi, D. (1999). Confidence intervals for the overlapping coefficient: the normal equal variance case. *Journal of the Royal Statistical Society*, 48(3), 413-418.
* Ruscio, J. (2008). A probability-based measure of effect size: robustness to base rates and other factors. *Psychological methods*, 13(1), 19–30.
* Ruscio, J., & Mullen, T. (2012). Confidence Intervals for the Probability of Superiority Effect Size Measure and the Area Under a Receiver Operating Characteristic Curve. *Multivariate Behavioral Research*, 47(2), 201–223.
