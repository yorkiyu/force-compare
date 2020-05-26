import resolve from '@rollup/plugin-node-resolve';
import commonJs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import postCss from 'rollup-plugin-postcss';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';
import postCssSimpleVars from 'postcss-simple-vars';
import postCssNested from 'postcss-nested';
import babel from 'rollup-plugin-babel';
import { name, homepage, version } from './package.json';

const plugins = [
  postCss({
    plugins: [
      postCssSimpleVars(),
      postCssNested(),
    ]
  }),
  webWorkerLoader(/* configuration */),
  babel({ exclude: 'node_modules/**' }),
  resolve(),
  commonJs(),
  json(),
];

export default [
  {
    input: 'src/Svg.js',
    output: [
      {
        format: 'umd',
        name: 'ForceSvg',
        file: `dist/ForceSvg.js`,
        sourcemap: false ,
      },
    ],
    plugins,
  },
  {
    input: 'src/Canvas.js',
    output: [
      {
        format: 'umd',
        name: 'ForceCanvas',
        file: `dist/ForceCanvas.js`,
        sourcemap: false ,
      },
    ],
    plugins,
  },
  {
    input: 'src/Webgl.js',
    output: [
      {
        format: 'umd',
        name: 'ForceWebgl',
        file: `dist/ForceWebgl.js`,
        sourcemap: false ,
      },
    ],
    plugins,
  },
  {
    input: 'src/CanvasWorker.js',
    output: [
      {
        format: 'umd',
        name: 'ForceCanvasWorker',
        file: `dist/ForceCanvasWorker.js`,
        sourcemap: false ,
      },
    ],
    plugins,
  },
  {
    input: 'src/WebglPoints.js',
    output: [
      {
        format: 'umd',
        name: 'ForceWebglPoints',
        file: `dist/ForceWebglPoints.js`,
        sourcemap: false ,
      },
    ],
    plugins
  }
];