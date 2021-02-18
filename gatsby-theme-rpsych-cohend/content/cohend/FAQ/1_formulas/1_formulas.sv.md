---
title: Vilka formler används?
order: 1
---

### Cohens *d*
Cohens *d* är helt enkelt den standardiserade medelvärdesskillnaden, 

$$ \delta = \frac{\mu_2-\mu_1}{\sigma}$$,

där $\delta$ är populationsparametern för Cohens *d*. Där det antas att $\sigma_1=\sigma_2=\sigma$, dvs., homogena populationsvarianser, och $\mu_i$ är respektive populations medelvärde.

### Cohens U<sub>3</sub>
Cohen (1977) definerade U<sub>3</sub> som ett mått på icke-överlapp, där vi "tar andelen av A-populationen som den övre halvan av fallen från Β-populationen överstiger". Cohens *d* kan konverteras till Cohens U<sub>3</sub> genom följande formel

$$U_3 = \Phi(\delta)$$,

där $\Phi$ är standardnormalfördelningens kumulativ fördelningsfunktion, och $\delta$ populationsvärdet för Cohens <em>d</em>. 

### Överlapp
Kallas generelt för *overlapping coefficient* (OVL). Cohens <em>d</em> kan konverteras till OVL genom följande formel (Reiser and Faraggi, 1999),

$$\text{OVL}=2\Phi(-|\delta|/2) $$

där $\Phi$ standardnormalfördelningens kumulativ fördelningsfunktion, och $\delta$ populationsvärdet för Cohens <em>d</em>. 

### Probability of superiority
Detta är en effektstorlek med många namn: *common language effect size* (CL), *Area under the receiver operating characteristics* (AUROC) eller bara A för sin icke-parametriska version (Ruscio & Mullen, 2012). Det är tänkt som en mer intuitivt effektstorlek för personer utan träning i statistik. Effektstorlek ger sannolikheten att en slumpmässigt utvald person från behandslingsgruppen kommer ha en högre poäng än en slumpmässigt utvald person från behandlingsgruppen. Cohens *d* kan konvertas till CL genom följande formel (Ruscio, 2008),

$$\text{CL}=\Phi\left(\frac{\delta}{\sqrt{2}}\right)$$

där $\Phi$ standardnormalfördelningens kumulativ fördelningsfunktion, och $\delta$ populationsvärdet för Cohens <em>d</em>. 

### Number Needed to Treat
NNT är antalet patienter vi skulle behöva behandla för att få 1 mer positivt utfall i behandlingsgruppen jämfört med kontrollgruppen. Furukawa och Leucht (2011) gav föjande formel för att konvert Cohens *d* till NNT,

$$ \text{NNT} = \frac{1}{  \Phi(\delta + \Psi(CER))-CER}$$

where $\Phi$ standardnormalfördelningens kumulativ fördelningsfunktion och $\Psi$ dess invers, CER är kontrollsgruppen händelsefrekvens och $\delta$ populationsvärdet för Cohens *d*. **OBS. CER är 20 % i visualiseringen. Du kan ändra på detta genom att trycka på inställningsikonen till höger om skjutreglaget**. Definitionen av en "händelse" eller "respons" är godtyckligt, och skulle kunna definieras som proportionen patienter i remission, t.ex. de som faller under en viss gräns på ett standardiserat formulär. Det är möjligt att konverta Cohens *d* till en version av NNT som ignorerar kontrollgruppens händelsefrekvens. Om du vill läsa mer om det kan du gå till Furukawa and Leucht (2011), som presenterar ett övertygande argument om varför det komplicerar tolkningen av NNT.

### R-kod för att beräkna NNT från Cohens *d*
Eftersom många har bett om R-kod för formel här ovanför så kommer det här

```r
CER <- 0.2
d <- 0.2
1 / (pnorm(d + qnorm(CER))-CER)
```

### Referenser

* Baguley, T. (2009). Standardized or simple effect size: what should be reported? *British journal of psychology*, 100(Pt 3), 603–17.
* Cohen, J. (1977). *Statistical power analysis for the behavioral sciencies*. Routledge.
* Furukawa, T. A., & Leucht, S. (2011). How to obtain NNT from Cohen's d: comparison of two methods. *PloS one*, 6(4).
* Reiser, B., & Faraggi, D. (1999). Confidence intervals for the overlapping coefficient: the normal equal variance case. *Journal of the Royal Statistical Society*, 48(3), 413-418.
* Ruscio, J. (2008). A probability-based measure of effect size: robustness to base rates and other factors. *Psychological methods*, 13(1), 19–30.
* Ruscio, J., & Mullen, T. (2012). Confidence Intervals for the Probability of Superiority Effect Size Measure and the Area Under a Receiver Operating Characteristic Curve. *Multivariate Behavioral Research*, 47(2), 201–223.
