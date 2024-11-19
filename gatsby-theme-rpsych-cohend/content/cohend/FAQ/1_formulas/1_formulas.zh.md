---
title: 公式们
order: 1
---

### Cohen's *d*
Cohen's *d* 可以简单理解为标准均差：

$$ \delta = \frac{\mu_2-\mu_1}{\sigma}$$,

其中$\delta$ 表示总体 Cohen's *d*； 假设 $\sigma_1=\sigma_2=\sigma$，即总体方差同质； 并且$\mu_i$ 表示相应总体的均值。

### Cohen's U<sub>3</sub>
Cohen (1977) 使用 U<sub>3</sub> 衡量不重合部分的大小。即“Β组别的上半部分样本超过A组别的百分比”。 Cohen's *d* 可以使用以下公式转换为 Cohen's U<sub>3</sub>：

$$U_3 = \Phi(\delta)$$

其中 $\Phi$ 表示标准正态分布的累积分布函数；$\delta$ 表示总体 Cohen's *d*。

### 重合部分 Overlap
通常我们称之为重叠系数（overlapping coefficient, OVL）。 Cohen's <em>d</em>可以使用以下公式转换为OVL (Reiser and Faraggi, 1999)：

$$\text{OVL}=2\Phi(-|\delta|/2) $$

其中 $\Phi$ 表示标准正态分布的累积分布函数；$\delta$ 表示总体 Cohen's *d*。

### 优效概率 Probability of superiority
该效应量具有很多名字：通用语言效应量（common language effect size, CL），接受者操作特性曲线下面积（AUC）或非参数统计里的A效应量 (Ruscio & Mullen, 2012)。 它旨在对没有统计学背景的人更具直观性。 该效应量表示从治疗组中随机抽样的人比从对照组中随机抽样的人得分更高的概率。 Cohen's *d*可以使用以下公式转换为CL (Ruscio, 2008)：

$$\text{CL}=\Phi\left(\frac{\delta}{\sqrt{2}}\right)$$

其中 $\Phi$ 表示标准正态分布的累积分布函数；$\delta$ 表示总体 Cohen's *d*。

### 需治疗人数 Number Needed to Treat, NNT
NNT指与对照组相比，我们为得到有益结果需要治疗的平均患者数量。 Furukawa 和 Leucht (2011) 给出了将 Cohen's *d* 转换为NNT的以下公式：

$$ \text{NNT} = \frac{1}{  \Phi(\delta + \Psi(CER))-CER}$$

其中 $\Phi$ 表示标准正态分布的累积分布函数； $\Psi$ 表示其反函数；CER 表示对照组事件发生率；并且 $\delta$ 表示总体 Cohen's *d*。 **请注意： 上述图例中 CER 被设置为 20% 。 你可以通过点击滑动条右侧的设置按钮来更改此值。** 上述出现的“事件”概念可以被任意定义。例如，“事件”可指代病情缓解的患者比例——在标准化量表的某个截止点以下的患者比例。 Cohen's *d*可以转换为相对对照组事件发生率不变的NNT。 感兴趣的读者可以参考Furukawa和Leucht (2011)，在他们的文章中给出了关于为什么这会增加NNT的解释复杂性的有力论点。

### 通过Cohen's *d*计算需治疗人数（NNT）的R代码
考虑到你们一直在问上述公式的R代码，请见下：

```r
CER <- 0.2
d <- 0.2
1 / (pnorm(d + qnorm(CER))-CER)
```

### 参考文献

* Baguley, T. (2009). Standardized or simple effect size: what should be reported? *British journal of psychology*, 100(Pt 3), 603–17.
* Cohen, J. (1977). *Statistical power analysis for the behavioral sciencies*. Routledge.
* Furukawa, T. A., & Leucht, S. (2011). How to obtain NNT from Cohen's d: comparison of two methods. *PloS one*, 6(4).
* Reiser, B., & Faraggi, D. (1999). Confidence intervals for the overlapping coefficient: the normal equal variance case. *Journal of the Royal Statistical Society*, 48(3), 413-418.
* Ruscio, J. (2008). A probability-based measure of effect size: robustness to base rates and other factors. *Psychological methods*, 13(1), 19–30.
* Ruscio, J., & Mullen, T. (2012). Confidence Intervals for the Probability of Superiority Effect Size Measure and the Area Under a Receiver Operating Characteristic Curve. *Multivariate Behavioral Research*, 47(2), 201–223.
