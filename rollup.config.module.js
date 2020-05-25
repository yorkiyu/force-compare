import postCss from 'rollup-plugin-postcss';
import postCssSimpleVars from 'postcss-simple-vars';
import postCssNested from 'postcss-nested';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';
import json from '@rollup/plugin-json';
import babel from 'rollup-plugin-babel';
import { name, dependencies } from './package.json';

export default {
  input: 'src/index.js',
  output: [
    {
      format: 'cjs',
      file: `dist/${name}.common.js`
    },
    {
      format: 'es',
      file: `dist/${name}.module.js`
    }
  ],
  external: Object.keys(dependencies),
  plugins: [
    postCss({
      plugins: [
        postCssSimpleVars(),
        postCssNested(),
      ]
    }),
    webWorkerLoader(/* configuration */),
    babel(),
    json()
  ]
}