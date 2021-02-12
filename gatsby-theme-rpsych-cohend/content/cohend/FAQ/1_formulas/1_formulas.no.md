---
title: Hvilke formler benyttes?
order: 1
---

### Cohens *d*
Cohens *d* er enkelt sagt den standardiserte forskjellen i gjennomsnitt,

$$ \delta = \frac{\mu_2-\mu_1}{\sigma}$$,

der $\delta$ er populasjosparameteret for Cohens *d*. Der det antas at $\sigma_1=\sigma_2=\sigma$, dvs., homogene populationsvarianser, og $\mu_i$ er respektive populasjonens gjennomsnittsverdi.

### Cohens U<sub>3</sub>
Cohen (1977) definerte U<sub>3</sub> som et mål på ikke-overlapp, der vi "tar andelen av A-populasjonen som blir overgått av den øvre halvdelen av Β-populasjonen". Cohens *d* kan konverteres til Cohens U<sub>3</sub> ved hjelp av følgende formel

$$U_3 = \Phi(\delta)$$,

der $\Phi$ er standardnormalfordelningens kumulative fordelningsfunksjon, og $\delta$ populationsverdien for Cohens <em>d</em>.

### Overlapp
Kalles generelt for *overlapping coefficient* (OVL). Cohens <em>d</em> kan konverteres til OVL ved hjelp av følgende formel (Reiser and Faraggi, 1999),

$$\text{OVL}=2\Phi(-|\delta|/2) $$

der $\Phi$ standardnormalfordelningens kumulative fordelningsfunksjon, og $\delta$ populationsverdien for Cohens <em>d</em>.

### Probability of superiority
Dette er en effektstørrelse med mange navn: *common language effect size* (CL), *Area under the receiver operating characteristics* (AUROC) eller bare A for sin ikke-parametriske versjon (Ruscio & Mullen, 2012). Det er tenkt som en mer intuitiv effektstørrelse for personer uten statistikkutdanning. Effektstørrelsen gir sannsynligheten for at en tilfeldig utvalgt person fra tiltaksgruppa har større score enn en tilfeldig utvalgt person fra kontrollgruppa. Cohens *d* kan konverteres til CL ved hjelp av følgende formel (Ruscio, 2008),

$$\text{CL}=\Phi\left(\frac{\delta}{\sqrt{2}}\right)$$

der $\Phi$ standardnormalfordelingens kumulative fordelningsfunksjon, og $\delta$ populasjonsverdien for Cohens <em>d</em>.

### Number Needed to Treat
NNT er antallet pasienter vi vil trenge å behandle for å få 1 flere positive utfall i tiltaksgruppa sammenlignet med kontrollgruppen. Furukawa og Leucht (2011) gav følgende formel for å regne om Cohens *d* til NNT,

$$ \text{NNT} = \frac{1}{  \Phi(\delta + \Psi(CER))-CER}$$

hvor $\Phi$ standardnormalfordelingens kumulative fordelningsfunksjon og $\Psi$ dens inverse, CER er kontrollsgruppa hendelsesfrekvens og $\delta$ populationsverdien for Cohens *d*. **OBS. CER er 20 % i visualiseringen. Du kan endra på dette ved å klikke på inställningsikonet til høyre om skjutreglaget**. Definitionen av en "händelse" eller "respons" är godtyckligt, og skulle kunne definieres som andelen pasienter i remission, for eksempel de som er under en viss terskelverdi med en standardiserat formel. Det er mulig å konvertere Cohens *d* til en versjon av NNT som ignorerer kontrollgruppas hendelsesfrekvens. Om du vil lesa mer om det kan du lese Furukawa & Leucht (2011), som presenterer overbevisende argument for hvorfor det kompliserer tolkninga av NNT.

### R-programmeringskode for å beregne NNT fra Cohens *d*
Fordi mange har spurt om R-kode for formelen ovenfor så viser jeg den her:

```r
CER <- 0.2
d <- 0.2
1 / (pnorm(d + qnorm(CER))-CER)
```

### Referanser

* Baguley, T. (2009). Standardized or simple effect size: what should be reported? *British journal of psychology*, 100(Pt 3), 603–17.
* Cohen, J. (1977). *Statistical power analysis for the behavioral sciencies*. Routledge.
* Furukawa, T. A., & Leucht, S. (2011). How to obtain NNT from Cohen's d: comparison of two methods. *PloS one*, 6(4).
* Reiser, B., & Faraggi, D. (1999). Confidence intervals for the overlapping coefficient: the normal equal variance case. *Journal of the Royal Statistical Society*, 48(3), 413-418.
* Ruscio, J. (2008). A probability-based measure of effect size: robustness to base rates and other factors. *Psychological methods*, 13(1), 19–30.
* Ruscio, J., & Mullen, T. (2012). Confidence Intervals for the Probability of Superiority Effect Size Measure and the Area Under a Receiver Operating Characteristic Curve. *Multivariate Behavioral Research*, 47(2), 201–223.
