# Help to translate



Currently the Cohen's *d* visualization has i18n support, and any help to translate the contents is very appreciated!

The translations are identified using the two-letter country code `lang_code`:

- `lang_code`: The ISO 3166-1 alpha-2 two-letter country code, Wikipedia has a [list with country codes](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)


## JSON files
There's some common UI elements that need to be translated in `gatsby-theme-rpsych/i18n/react-i18next`, these are `JSON` files with the following structure

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
The translations are identified using the keys in the JSON files. You can copy the `en` folder and replace the english text with your translations (but don't change the keys!)

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

## How to share your translations with me
If you know how to use git then fork the repo and send a pull request when your are done. 

If you are unfamiliar with git then you can download the files, add your translations, and email them to me.

## Preview your translations
If you don't want to/don't know how to preview the site locally, then just ask me to send you a preview link after you've added your translation.

The easiest way to start a local development copy is to use `docker-compose`:

```
docker-compose build
docker-compose run
```
Then you can view the page at `http://localhost:8000/cohend`

## Attribution
The translation will be attributed to you on the translated page, e.g. "translated by Your Name". I can link to your webpage and/or Twitter if you'd like.

Let me know if you don't want to be mentioned as a translator.

## Other 
The file `gatsby-theme-rpsych/assets/availableTranslations.yml` is sourced by the menu component to show the available translations, I can change this file.
