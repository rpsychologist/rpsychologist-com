---
title: Formulalar qanday?
order: 1
---

### Cohen *d*
Cohen *d*-ning oddiygina standartlashtirilgan o'rtacha farq,

$$ \delta = \frac{\mu_2-\mu_1}{\sigma}$$,

bu yerda $\delta$ - Cohen *d*-ning populyatsiya parametri. Qayerda $\sigma_1=\sigma_2=\sigma$, ya'ni bir hil populyatsiya dispersiyalari deb taxmin qilinadi. Va $\mu_i$ - tegishli aholining o'rtacha qiymati.

### Cohen U<sub>3</sub>
Cohen (1977) U<sub>3</sub>ni bir-biriga mos kelmaslik o'lchovi sifatida ta'riflagan, bu erda biz "A populyatsiyasining B populyatsiya holatlarining yuqori yarmidan oshib ketgan foizini olamiz". Cohen *d*-ni quyidagi formula yordamida Cohen U<sub>3</sub> ga aylantirish mumkin.

$$U_3 = \Phi(\delta)$$

bu yerda $\Phi$ standart normal taqsimotning kumulyativ taqsimot funksiyasi va Cohen <em>d</em>-ning $\delta$ populyatsiyasi.

### O'xshashlik
Odatda bir-biriga o'xshash koeffitsient (OVL) deb ataladi. Cohen <em>d</em>ni quyidagi formula yordamida OVL ga aylantirish mumkin (Reiser va Faraggi, 1999)

$$\text{OVL}=2\Phi(-|\delta|/2) $$

bu yerda $\Phi$ standart normal taqsimotning kumulyativ taqsimot funksiyasi va Cohen *d*-ning $\delta$ populyatsiyasi.

### Ustunlik ehtimoli
Bu ko'plab nomlarga ega effekt hajmi: umumiy til effekti o'lchami (UT), qabul qiluvchining ishlash xususiyatlari ostidagi maydon (QIM) yoki uning parametrik bo'lmagan versiyasi uchun faqat A (Ruscio & Mullen, 2012). Bu statistika bo'yicha hech qanday ma'lumotga ega bo'lmagan odamlar uchun yanada intuitiv bo'lishi uchun mo'ljallangan. Ta'sir hajmi davolash guruhidan tasodifiy tanlangan kishi nazorat guruhidan tasodifiy tanlangan kishiga qaraganda yuqori ball olish ehtimolini beradi. Cohen *d* ni quyidagi formula yordamida UT ga aylantirish mumkin (Ruscio, 2008)

$$\text{CL}=\Phi\left(\frac{\delta}{\sqrt{2}}\right)$$

bu yerda $\Phi$ standart normal taqsimotning kumulyativ taqsimot funksiyasi va Cohen *d*-ning $\delta$ populyatsiyasi.

### Davolash uchun zarur bo'lgan raqam
NNT - bu nazorat guruhiga nisbatan ko'proq ijobiy natijaga erishish uchun biz aralashuv bilan davolashimiz kerak bo'lgan bemorlar soni. Furukawa va Leucht (2011) Cohen *d*-ni NNT ga aylantirish uchun quyidagi formulani beradi.

$$ \text{NNT} = \frac{1}{  \Phi(\delta + \Psi(CER))-CER}$$

bu yerda $\Phi$ standart normal taqsimotning kümülatif taqsimot funksiyasi va $\Psi$ uning teskarisi, CER - nazorat guruhining hodisa tezligi va $\delta$ populyatsiyasi Cohen *d*-ning. **N.B. Yuqoridagi vizualizatsiyada CER 20% ga sozlangan. Buni slayderning oʻng tomonidagi sozlamalar belgisini bosish orqali oʻzgartirishingiz mumkin**. "Hodisa" yoki "javob" ta'rifi o'zboshimchalik bilan va remissiyada bo'lgan bemorlarning nisbati sifatida belgilanishi mumkin, masalan. standartlashtirilgan so'rovnoma bo'yicha ba'zi bir kesish. Cohen *d*-ning ni NNT ning nazorat guruhining hodisalar tezligiga o'zgarmas versiyasiga aylantirish mumkin. Qiziqqan o'quvchi Furukawa va Leucht (2011) ga qarashi kerak, bu erda nima uchun bu NNT talqinini murakkablashtirishi haqida ishonchli dalil berilgan.

### Cohen *d*-dan NNTni hisoblash uchun R kodi
Ko'pchilik yuqoridagi formula uchun R kodi haqida so'raganligi sababli, bu erda

```r
CER <- 0.2
d <- 0.2
1 / (pnorm(d + qnorm(CER))-CER)
```

### Iqtiboslar

* Baguley, T. (2009). Standardized or simple effect size: what should be reported? *British journal of psychology*, 100(Pt 3), 603–17.
* Cohen, J. (1977). *Statistical power analysis for the behavioral sciencies*. Routledge.
* Furukawa, T. A., & Leucht, S. (2011). How to obtain NNT from Cohen's d: comparison of two methods. *PloS one*, 6(4).
* Reiser, B., & Faraggi, D. (1999). Confidence intervals for the overlapping coefficient: the normal equal variance case. *Journal of the Royal Statistical Society*, 48(3), 413-418.
* Ruscio, J. (2008). A probability-based measure of effect size: robustness to base rates and other factors. *Psychological methods*, 13(1), 19–30.
* Ruscio, J., & Mullen, T. (2012). Confidence Intervals for the Probability of Superiority Effect Size Measure and the Area Under a Receiver Operating Characteristic Curve. *Multivariate Behavioral Research*, 47(2), 201–223.
