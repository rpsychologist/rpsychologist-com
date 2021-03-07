import React from "react";
import i18n from "i18next"
import { I18nextProvider } from "react-i18next"
import { LocaleProvider } from "gatsby-theme-i18n"

const wrapPageElement = ({ element, props }) => {
  const { locale = 'en', originalPath } = props.pageContext
  const ns = ['blog']
  switch(originalPath) {
    case '/cohend/':
      ns[1] = 'cohend'
      break;
  }
  //originalPath === '/cohend/' && ns.push('cohend')
  const i18nextOptions = {
    defaultNS: 'translation',
    ns: ns,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      transSupportBasicHtmlNodes: true, // allow <br/> and simple html elements in translations
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i'],
    },
    //debug: process.env.NODE_ENV == 'development',
    debug: false,
    initImmediate: false,
  }
  let resources = {}
  i18nextOptions.ns.forEach((name) => {
    let data
    switch(name) {
      case "cohend":
        data = require(`gatsby-theme-rpsych-cohend/i18n/react-i18next/${locale}/cohend.json`)
        break;
      case "blog":
        data = require(`gatsby-theme-rpsych/i18n/react-i18next/${locale}/blog.json`)
        break;
      default:
        break;
    }
    resources = {
      ...resources,
      [locale]: {
        ...resources[locale],
        [name]: data,
      },
    }
  })
  const i18nConfig = {
    lng: locale,
    resources,
    ...i18nextOptions,
  }

  i18n.init(i18nConfig)
  return (
    <LocaleProvider pageContext={props.pageContext}>
        <I18nextProvider i18n={i18n}>
          {element}
        </I18nextProvider>
        </LocaleProvider>
  );
};

export {wrapPageElement}