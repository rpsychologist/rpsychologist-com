---
title: "More PubMed data mining: looking at top 20 CBT journals"
date: 2012-04-26 11:59
author: Kristoffer Magnusson
category: R
tags: 
  - Cognitive behavioral therapy
  - ggplot2
  - PubMed
slug: more-pubmed-data-mining-looking-at-top-20-cbt-journals
summary: In this short article I present some data of the top 20 Cognitive Behavior Therapy (CBT) journals with the most PubMed publications, and compare that to data from 2010 and 2011.
---

# Introduction

Continuing from what I wrote in my article [An R Script to Automatically
download PubMed Citation Counts By Year of Publication][], I’ve now
looked at article counts for journals. I did this by extending my script
to download the complete article records in XML from inside R. Then I
simply extracted journal names from each article and counted how many
times different journal occurred. What’s cool about my new script is
that it’s possible to extract any PubMed field; so more data will surely
follow in subsequent articles.

Specifically, I looked at journals related to Cognitive Behavior
Therapy. I did tree searches, one for 2010, one for 2011 and lastly one
for the total year range. By doing this I could visualize which journals
had the most publications in total and compare that to recent years.

# The query

I didn’t care to use a really comprehensive query, as I was more
interested in testing my script. Nonetheless, the base query looked like
this:

```html
*"cognitive behavior therapy" OR "cognitive behavioral therapy" OR "cognitive therapy"*
```

# Results

The total number of hits for all years was 14342 hits, from which I
extracted 1667 different journals. After extracting the top 20 journals
with the most publications over time I made these two graphs.

![Top 20 Cognitive Behavior Therapy journals by PubMed citation
count. By Kristoffer Magnusson](./img/cbt_top20_journals_PubMed_Annual_counts.png)

As you can see the *Journal of Consulting and Clinical Psychology* has
had the most publications over time, but *Behavior Research and Therapy*
has had more publications in recent years. This is not really that
surprising, since the Journal of Consulting and Clinical Psychology has
existed since 1937 whilst Behavior Research and Therapy started out in
1963.

# Where’s the R code?

**Update:** Here's the R script: [How to download complete XML records
from PubMed and extract data][]

  [An R Script to Automatically download PubMed Citation Counts By Year of Publication]: http://rpsychologist.com/an-r-script-to-automatically-look-at-pubmed-citation-counts-by-year-of-publication
    "An R Script to Automatically download PubMed Citation Counts By Year of Publication"
  [How to download complete XML records from PubMed and extract data]: http://rpsychologist.com/how-to-download-complete-xml-records-from-pubmed-and-extract-data
    "How to download complete XML records from PubMed and extract data"
