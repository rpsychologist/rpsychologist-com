# Help to translate

Currently the [Cohen's *d* visualization](https://rpsychologist.com/cohend) has i18n support, and any help to translate the contents is very appreciated!

## GitHub workflow
The preferred workflow is using GitHub PRs (however using GitHub is _not_ a requirement to contribute)
- Check if there's an open PR for your language, and check [this issue](https://github.com/rpsychologist/rpsychologist-com/issues/12)
    + If someone is already working on a translation reach out to them and collaborate
- Fork this repo
- Create a **Draft Pull Request**
    + Make sure to check **Allow edits from maintainers**
- When the translation is complete change the status to **Ready for review**

If you create a draft pull request as soon as you start working on a translation, it will make it easier for others to avoid doing duplicate work.

## Which files to translate
The translations are identified using the two-letter country code `lang_code`:

- `lang_code`: The ISO 3166-1 alpha-2 two-letter country code, Wikipedia has a [list with country codes](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)

## JSON files
There are some common UI elements that need to be translated in `gatsby-theme-rpsych/i18n/react-i18next`, 

```
.
└── gatsby-theme-rpsych
    └── i18n
        ├── config.json # gatsby-theme-i18n config
        └── react-i18next
            ├── en
            |   ├── 404.json
            |   └── blog.json
            └── <lang_code>     # add
                ├── 404.json
                └── blog.json

```
The phrases are identified using the keys in the JSON files. You can copy the `en` folder and replace the English text with your translations (but don't change the keys!), the `JSON` files have the following structure

```JSON
{
  "key": "translation here"
}
```

There are also keys in `gatsby-theme-rpsych-cohend/i18n/react-i18next`, that need to be translated

```
.
├── gatsby-theme-rpsych-cohend
    └── i18n
        └── react-i18next
            ├── en
            |   └── cohend.json
            └── <lang_code>         # add
                └── cohend.json
```


## Markdown/MDX files

Some of the content are sourced from markdown/MDX files, these need to be translated by creating new files for the new language.

```
.
└── gatsby-theme-rpsych-cohend
    └── content
        └── cohend
            ├── common-language
            |   ├── common-language.en.mdx
            |   └── common-language.<lang_code>.mdx     # add
            ├── FAQ
            |   └── ... 
            └── intro
                └── ...
```
The files in `FAQ` and `intro` also needs to be translated

### Checklist
For a complete translation you will have the following modified (M) and added (A) files

```bash
M        gatsby-theme-rpsych/assets/availableTranslations.yml

M        gatsby-theme-rpsych/i18n/config.json

A        gatsby-theme-rpsych/i18n/react-i18next/<lang_code>/404.json
A        gatsby-theme-rpsych/i18n/react-i18next/<lang_code>/blog.json

A        gatsby-theme-rpsych-cohend/i18n/react-i18next/<lang_code>/cohend.json

A        gatsby-theme-rpsych-cohend/content/cohend/intro/intro.<lang_code>.mdx

A        gatsby-theme-rpsych-cohend/content/cohend/FAQ/0_help/0_help.<lang_code>.md
A        gatsby-theme-rpsych-cohend/content/cohend/FAQ/1_formulas/1_formulas.<lang_code>.md
A        gatsby-theme-rpsych-cohend/content/cohend/FAQ/2_citation/2_citation.<lang_code>.mdx
A        gatsby-theme-rpsych-cohend/content/cohend/FAQ/3_bug/3_bug.<lang_code>.md
A        gatsby-theme-rpsych-cohend/content/cohend/FAQ/4_load/4_load.<lang_code>.md
A        gatsby-theme-rpsych-cohend/content/cohend/FAQ/5_overlap/5_overlap.<lang_code>.md
A        gatsby-theme-rpsych-cohend/content/cohend/FAQ/6_viz_license/6_viz_license.<lang_code>.md

A        gatsby-theme-rpsych-cohend/content/cohend/common-language/common-language.<lang_code>.mdx
```

## I want to help but I don't know how to use git
If you are unfamiliar with git then you can download the files, add your translations, and email them to me (or share the files using your preferred cloud storage).

## Preview your translations
If you don't want to/don't know how to preview the site locally, then just ask me to send you a preview link after you've added your translation.

The easiest way to start a local development copy is to use `docker-compose`:

```
docker-compose build
docker-compose up
```
Then you can view the page at `http://localhost:8000/cohend`

## Attribution
The translation will be attributed to you on the translated page, e.g., "translated by Your Name". I can link to your webpage and/or Twitter if you'd like.

Let me know if you don't want to be mentioned as a translator.

## Other 
The file `gatsby-theme-rpsych/assets/availableTranslations.yml` is sourced by the menu component to show the available translations, I can change this file.
