---
title: What are the formulas?
order: 1
---


### Statistical model
Therapist effects are usually described and estimated using a 2-level multilevel model. In a 2-level model where the therapists are fully nested within treatments, the regression for the *i*th participant’s outcome $y_{ij}$ belonging to therapist *j* is given by,
$$
y_{ij} = \beta_{0j} + e_i
$$

The second level, the therapist level, includes the treatment effect,
$$
\beta_{0j} = \gamma_0 + \delta_1 x_j + u_j,
$$
where the random effects are assumed to be normally distributed and independent, $u_{j} ~ \sim\mathcal{N}(0, \sigma_u^2)$ and
$e_{ij} ~ \sim\mathcal{N}(0, \sigma_e^2)$. The treatment indicator $x_j$ is coded 0 for control and 1 for the treatment group.

### Cohen's *d*
Cohen's *d* is simply the standardized mean difference, 

$$ 
d = \frac{\delta_1}{\sqrt{\sigma_u^2 + \sigma_e^2}}
$$.

### Intraclass correlation
The usual measure of therapist effects, the intraclass correlation, is given by,

$$
\frac{\sigma_u^2}{\sigma_u^2 + \sigma_e^2}
$$


### Cohen's <em>U<sub>3</sub></em>
Cohen (1977) defined <em>U<sub>3</sub></em> as a measure of non-overlap, where "we take the percentage of the A population which the upper half of the cases of the Β population exceeds". Cohen's *d* can be converted to Cohen's <em>U<sub>3</sub></em> using the following formula

$$
U_3 = \Phi(\frac{\delta}{\sigma_u})
$$,

where $\Phi$ is the cumulative distribution function of the standard normal distribution, $\delta$ is the raw treatment effect, and $\sigma_u^2$ the therapist variance.

### Overlap
Generally called the overlapping coefficient (OVL; Reiser and Faraggi, 1999). For therapist effects it can be calculated by, 

$$
\text{OVL}=2\Phi(-|\frac{\delta}{\sigma_u}|/2)
$$,

where $\Phi$ is the cumulative distribution function of the standard normal distribution, $\delta$ is the raw treatment effect, and $\sigma_u^2$ the therapist variance.

### Probability of superiority
A standardized value can be converted to the probability of superiority using the following formula (Ruscio, 2008),

$$
\Phi\left(\frac{\delta}{\sqrt{2}}\right)
$$,

where $\Phi$ is the cumulative distribution function of the standard normal distribution, $\delta$ is the raw treatment effect, and $\sigma_u^2$ the therapist variance.

### References

* Baguley, T. (2009). Standardized or simple effect size: what should be reported? *British journal of psychology*, 100(Pt 3), 603–17.
* Cohen, J. (1977). *Statistical power analysis for the behavioral sciencies*. Routledge.
* Reiser, B., & Faraggi, D. (1999). Confidence intervals for the overlapping coefficient: the normal equal variance case. *Journal of the Royal Statistical Society*, 48(3), 413-418.
* Ruscio, J. (2008). A probability-based measure of effect size: robustness to base rates and other factors. *Psychological methods*, 13(1), 19–30.
* Ruscio, J., & Mullen, T. (2012). Confidence Intervals for the Probability of Superiority Effect Size Measure and the Area Under a Receiver Operating Characteristic Curve. *Multivariate Behavioral Research*, 47(2), 201–223.
