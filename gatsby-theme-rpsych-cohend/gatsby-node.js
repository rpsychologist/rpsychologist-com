// const path = require(`path`)
// exports.createPages = async ({ graphql, actions }) => {
//   const { createPage } = actions;
//   // const queryResults = await graphql(`
//   //   query AllProducts {
//   //     allProducts {
//   //       nodes {
//   //         id
//   //         name
//   //         price
//   //         description
//   //       }
//   //     }
//   //   }
//   // `);
//   const template = require.resolve(`./src/App.js`);
//   createPage({
//     path: `/cohend/`,
//     component: template,
//     context: {
//       // This time the entire product is passed down as context
//       product: "hello",
//     },
//   });
// };
