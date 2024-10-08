/**
 * Copyright IBM Corp. 2016, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const { babel } = require('@rollup/plugin-babel');
const commonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const path = require('path');
const { rollup } = require('rollup');
const stripBanner = require('rollup-plugin-strip-banner');
const packageJson = require('../package.json');

async function build() {
  const entrypoints = [
    {
      filepath: path.resolve(__dirname, '..', 'src', 'index.js'),
      outputDirectory: path.resolve(__dirname, '..'),
    },
  ];
  const formats = [
    {
      type: 'esm',
      directory: 'es',
    },
    {
      type: 'commonjs',
      directory: 'lib',
    },
  ];

  for (const entrypoint of entrypoints) {
    const inputConfig = getRollupConfig(entrypoint.filepath);
    const bundle = await rollup(inputConfig);

    for (const format of formats) {
      await bundle.write({
        dir: path.join(entrypoint.outputDirectory, format.directory),
        format: format.type,
        preserveModules: true,
        preserveModulesRoot: path.dirname(entrypoint.filepath),
        banner,
        exports: 'auto',
      });
    }
  }
}

const banner = `/**
 * Copyright IBM Corp. 2016, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
`;

function getRollupConfig(input) {
  return {
    input,
    external: [
      ...Object.keys(packageJson.peerDependencies),
      ...Object.keys(packageJson.dependencies),
      ...Object.keys(packageJson.devDependencies),
    ],
    plugins: [
      nodeResolve(),
      commonjs({
        include: /node_modules/,
      }),
      babel({
        babelrc: false,
        exclude: ['node_modules/**'],
        presets: [
          [
            '@babel/preset-env',
            {
              modules: false,
              targets: {
                browsers: ['extends browserslist-config-carbon'],
              },
            },
          ],
          '@babel/preset-react',
        ],
        plugins: [
          'dev-expression',
          '@babel/plugin-proposal-export-default-from',
          '@babel/plugin-transform-class-properties',
          '@babel/plugin-transform-export-namespace-from',
          '@babel/plugin-transform-react-constant-elements',
        ],
        babelHelpers: 'bundled',
      }),
      stripBanner(),
    ],
  };
}

build().catch((error) => {
  console.log(error);
  process.exit(1);
});
