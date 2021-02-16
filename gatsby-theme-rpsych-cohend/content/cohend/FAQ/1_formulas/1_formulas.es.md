---
title: ¿Cuales son las fórmulas?
order: 1
---

### *d* de Cohen
La *d* de Cohen es simplemente la diferencia media estandarizada, 

$$ \delta = \frac{\mu_2-\mu_1}{\sigma}$$,

donde $\delta$ es el parámetro poblacional de la *d* de Cohen. Se asume que $\sigma_1=\sigma_2=\sigma$, es decir, las varianzas poblacionales son homogéneas. Y $\mu_i$ es la media de la población correspondiente.

### U<sub>3</sub> de Cohen
Cohen (1977) definió U<sub>3</sub> como una medida de no superposición, donde "tomamos el porcentaje de la población A que supera la mitad superior de los casos de la población Β". La *d* de Cohen puede convertirse en la U<sub>3</sub> de Cohen mediante la siguiente fórmula

$$U_3 = \Phi(\delta)$$

donde $\Phi$ es la función de distribución acumulada de la distribución normal estándar, y $\delta$ la <em>d</em> de Cohen poblacional. 

### Superposición
Generalmente se le denomina coeficiente de superposición (OVL). La <em>d</em> de Cohen puede convertirse a OVL mediante la siguiente fórmula (Reiser y Faraggi, 1999)

$$\text{OVL}=2\Phi(-|\delta|/2) $$

donde $\Phi$ es la función de distribución acumulada de la distribución normal estándar, y $\delta$ la <em>d</em> de Cohen poblacional. 

### Probabilidad de superioridad
Se trata de una medida del tamaño del efecto con muchos nombres: índice universal del tamaño del efecto (*common language effect size*; CL), área bajo la curva ROC (Característica Operativa del Receptor) o simplemente A para su versión no paramétrica (Ruscio y Mullen, 2012). Está pensada para ser más intuitiva para personas sin formación en estadística. Este tamaño del efecto proporciona la probabilidad de que una persona elegida al azar del grupo de tratamiento tenga una puntuación más alta que una persona elegida al azar del grupo control. La *d* de Cohen puede convertirse en CL mediante la siguiente fórmula (Ruscio, 2008)

$$\text{CL}=\Phi\left(\frac{\delta}{\sqrt{2}}\right)$$

donde $\Phi$ es la función de distribución acumulada de la distribución normal estándar, y $\delta$ la <em>d</em> de Cohen poblacional. 

### Número Necesario para Tratar
El NNT es el número de pacientes que necesitaríamos tratar con la intervención para conseguir un resultado favorable más en comparación con el grupo control. Furukawa y Leucht (2011) ofrecen la siguiente fórmula para convertir la *d* de Cohen en NNT

$$ \text{NNT} = \frac{1}{  \Phi(\delta + \Psi(CER))-CER}$$

donde $\Phi$ es la función de distribución acumulada de la distribución normal estándar y $\Psi$ su inversa, el CER es la tasa de eventos de control, y $\delta$ la <em>d</em> de Cohen poblacional. **N.B. El CER está fijado en el 20% en la visualización de arriba. Puedes cambiarlo pulsando el símbolo de ajustes a la derecha del *slider***. La definición de un "evento" o una "respuesta" es arbitraria y podría definirse como la proporción de pacientes que están en remisión, por ejemplo, por debajo de algún punto de corte en un cuestionario estandarizado. Es posible convertir la *d* de Cohen en una versión del NNT que sea independiente de la tasa de eventos de control. El lector interesado puede consultar Furukawa y Leucht (2011), donde se ofrece una explicación detallada de por qué esto complica la interpretación del NNT.

### Código en R para calcular el NNT a partir de la *d* de Cohen
Como muchos habéis preguntado por el código R para la fórmula anterior, aquí lo tenéis

```r
CER <- 0.2
d <- 0.2
1 / (pnorm(d + qnorm(CER))-CER)
```

### Referencias

* Baguley, T. (2009). Standardized or simple effect size: what should be reported? *British journal of psychology*, 100(Pt 3), 603–17.
* Cohen, J. (1977). *Statistical power analysis for the behavioral sciencies*. Routledge.
* Furukawa, T. A., & Leucht, S. (2011). How to obtain NNT from Cohen's d: comparison of two methods. *PloS one*, 6(4).
* Reiser, B., & Faraggi, D. (1999). Confidence intervals for the overlapping coefficient: the normal equal variance case. *Journal of the Royal Statistical Society*, 48(3), 413-418.
* Ruscio, J. (2008). A probability-based measure of effect size: robustness to base rates and other factors. *Psychological methods*, 13(1), 19–30.
* Ruscio, J., & Mullen, T. (2012). Confidence Intervals for the Probability of Superiority Effect Size Measure and the Area Under a Receiver Operating Characteristic Curve. *Multivariate Behavioral Research*, 47(2), 201–223.
