---
title: Formüller nedir?
order: 1
---

### Cohen *d*
Cohen *d* basitçe standartlaştırılmış ortalama farkıdır,

$$ \delta = \frac{\mu_2-\mu_1}{\sigma}$$,

$\delta$, Cohen *d*'sinin popülasyon parametresidir. $\sigma_1=\sigma_2=\sigma$ yani popülasyon varyanslarının homojen olduğu varsayıldığında. Ve $\mu_i$, ilgili popülasyonun ortalamasıdır.

### Cohen U<sub>3</sub>
Cohen (1977), U<sub>3</sub>'yu bir örtüşmeme ölçüsü olarak tanımladı; burada "Β popülasyonunun vakalarının üst yarısını aştığı A popülasyonunun yüzdesini alıyoruz". Cohen *d*'si aşağıdaki formül kullanılarak Cohen U<sub>3</sub>'ya dönüştürülebilir

$$U_3 = \Phi(\delta)$$

burada $\Phi$ standart normal dağılımın kümülatif dağılım işlevidir ve $\delta$ popülasyon Cohen <em>d</em>'sidir.

### Örtüşme
Genellikle örtüşme katsayısı (OVL) olarak adlandırılır. Cohen <em>d</em> aşağıdaki formül kullanılarak OVL'ye dönüştürülebilir (Reiser ve Faraggi, 1999)

$$\text{OVL}=2\Phi(-|\delta|/2) $$

burada $\Phi$ standart normal dağılımın kümülatif dağılım fonksiyonudur ve $\delta$ popülasyon Cohen *d*'sidir.

### Üstünlük olasılığı
Bu, birçok isimle etki büyüklüğüdür: ortak dil etki büyüklüğü (CL), alıcı işletim karakteristiklerinin altındaki alan (AUC) veya parametrik olmayan versiyonu için basitçe A (Ruscio & Mullen, 2012). İstatistik eğitimi almamış kişiler için daha sezgisel olması amaçlanmıştır. Etki büyüklüğü, deney grubundan rastgele seçilen bir kişinin kontrol grubundan rastgele seçilen bir kişiden daha yüksek puan alma olasılığını verir. Cohen *d* aşağıdaki formül kullanılarak CL'ye dönüştürülebilir (Ruscio, 2008)

$$\text{CL}=\Phi\left(\frac{\delta}{\sqrt{2}}\right)$$

burada $\Phi$ standart normal dağılımın kümülatif dağılım işlevidir ve $\delta$ popülasyon Cohen *d*'sidir.

### İyileşme için gereken kişi sayısı
NNT, kontrol grubuna kıyasla bir tane daha olumlu sonuç elde edilmesi amacıyla iyileşme için gereken kişi sayısıdır. Furukawa ve Leucht (2011), Cohen *d*'yi NNT'ye dönüştürmek için aşağıdaki formülü verir.

$$ \text{NNT} = \frac{1}{  \Phi(\delta + \Psi(CER))-CER}$$

$\Phi$ standart normal dağılımın kümülatif dağılım fonksiyonu ve $\Psi$ bunun tersi olduğunda, KGO kontrol grubu gözlem oranı ve $\delta$ popülasyon Cohen *d< /em>'sidir. **N.B. Yukarıdaki görselleştirmede, KGO %20 olarak ayarlanmıştır. Kaydırıcının sağındaki ayarlar simgesine basarak değiştirebilirsiniz**. Bir "olay" veya "yanıt" tanımı keyfidir ve remisyonda olan hastaların oranı olarak tanımlanabilir, örn. standart bir anketin belirli bir kesme puanının altındakiler/üstündekiler. Kontrol grubu gözlem oranından (KGO) bağımsız olarak Cohen *d* değerini NNT'ye dönüştürmek mümkündür. İlgilenenler, bunun NNT'nin yorumlanmasını neden karmaşık hale getirdiğine dair ikna edici bir argümanın verildiği Furukawa ve Leucht (2011) kaynağına bakmalıdır.</p>

### Cohen *d*'den NNT'yi hesaplamak için R kodu
Birçoğu yukarıdaki formül için R kodunu sorduğundan, işte burada

```r
CER <- 0.2
d <- 0.2
1 / (pnorm(d + qnorm(CER))-CER)
```

### Kaynaklar

* Baguley, T. (2009). Standardized or simple effect size: what should be reported? *British journal of psychology*, 100(Pt 3), 603–17.
* Cohen, J. (1977). *Statistical power analysis for the behavioral sciencies*. Routledge.
* Furukawa, T. A., & Leucht, S. (2011). How to obtain NNT from Cohen's d: comparison of two methods. *PloS one*, 6(4).
* Reiser, B., & Faraggi, D. (1999). Confidence intervals for the overlapping coefficient: the normal equal variance case. *Journal of the Royal Statistical Society*, 48(3), 413-418.
* Ruscio, J. (2008). A probability-based measure of effect size: robustness to base rates and other factors. *Psychological methods*, 13(1), 19–30.
* Ruscio, J., & Mullen, T. (2012). Confidence Intervals for the Probability of Superiority Effect Size Measure and the Area Under a Receiver Operating Characteristic Curve. *Multivariate Behavioral Research*, 47(2), 201–223.
