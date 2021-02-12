const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)
const { createURLRegEx } = require(`gatsby-theme-rpsych/src/utils/helpers`);
const { withDefaults } = require(`gatsby-theme-i18n/utils/default-options`);
const {
  localizedPath,
  getLanguages,
  getDefaultLanguage,
} = require(`gatsby-theme-i18n/src/helpers`);

const i18nOptions = {
  configPath: require.resolve(`./i18n/config.json`),
  defaultLang: "en",
  prefixDefault: false,
  locales: null,
};

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions;

  createTypes(`
      type ThemeI18n implements Node {
        defaultLang: String
        prefixDefault: Boolean
        configPath: String
        config: [Locale]
      }
      
      type Locale {
        code: String
        hrefLang: String
        dateFormat: String
        langDir: String
        localName: String
        name: String
      }
    `);
};


exports.sourceNodes = (
  { actions, createContentDigest, createNodeId }) => {
  const { createNode } = actions;

  const config = require(i18nOptions.configPath);

  const configNode = {
    ...i18nOptions,
    config,
  };

  createNode({
    ...configNode,
    id: createNodeId(`gatsby-theme-i18n-config`),
    parent: null,
    children: [],
    internal: {
      type: `ThemeI18n`,
      contentDigest: createContentDigest(configNode),
      content: JSON.stringify(configNode),
      description: `Options for gatsby-theme-i18n`,
    },
  });
};

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;
  const { defaultLang } = i18nOptions
  if (node.internal.type === `Mdx`) {
    const name = path.basename(node.fileAbsolutePath, `.mdx`);
    const isDefault = name === `index`;
    const lang = isDefault ? defaultLang : name.split(`.`)[1];
    let value;
    // use YAML slug if it exists
    if (node.frontmatter && node.frontmatter.slug) {
      value = `/${node.frontmatter.slug}`
    } else {
      value = createFilePath({ node, getNode });
    }
    createNodeField({
      name: `slug`,
      node,
      value,
    })
    createNodeField({ node, name: `locale`, value: lang });
    createNodeField({ node, name: `isDefault`, value: isDefault });
  }
};

exports.onCreatePage = ({ page, actions }) => {
  const { createPage, deletePage } = actions;
  const { configPath, defaultLang, locales, prefixDefault } = i18nOptions
  // Check if originalPath was already set and bail early as otherwise an infinite loop could occur
  // as other plugins like gatsby-plugin-mdx could modify this
  if (page.context.originalPath) {
    return;
  }
  const originalPath = page.path;

  if(originalPath === "/cohend/") {
    deletePage(page);

    const configLocales = require(configPath);
  
    const languages = getLanguages({
      locales: configLocales,
      localeStr: locales,
    });
  
    const defaultLocale = getDefaultLanguage({
      locales: configLocales,
      defaultLang,
    });
  
    languages.forEach((locale) => {
      const newPage = {
        ...page,
        path: localizedPath({
          defaultLang,
          prefixDefault,
          locale: locale.code,
          path: originalPath,
        }),
        matchPath: page.matchPath
          ? localizedPath({
              defaultLang,
              prefixDefault,
              locale: locale.code,
              path: page.matchPath,
            })
          : page.matchPath,
        context: {
          ...page.context,
          locale: locale.code,
          hrefLang: locale.hrefLang,
          originalPath,
          dateFormat: locale.dateFormat,
          permalinkRegEx: createURLRegEx(page.path, (d3Slug = true)),
        },
      };
  
      // Check if the page is a localized 404
      if (newPage.path.match(/^\/[a-z]{2}\/404\/$/)) {
        // Match all paths starting with this code (apart from other valid paths)
        newPage.matchPath = `/${locale.code}/*`;
      }
  
      createPage(newPage);
    });
  
  }
  
  // When prefixDefault is set the default development & production 404 pages
  // will be deleted but not re-created in the above `languages.forEach` segment
  // Thus we'll re-create them manually here

  const notFoundPages = [`/404/`, `/404.html`, `/dev-404-page/`];

  if (prefixDefault) {
    if (notFoundPages.includes(originalPath)) {
      const newPage = {
        ...page,
        context: {
          ...page.context,
          locale: defaultLocale.code,
          hrefLang: defaultLocale.hrefLang,
          originalPath,
          dateFormat: defaultLocale.dateFormat,
        },
      };

      createPage(newPage);
    }
  }
};
