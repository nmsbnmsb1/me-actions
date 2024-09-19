const pkg = require('./package.json');
const replace = require('@rollup/plugin-replace');
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('rollup-plugin-typescript2');

const node = {
	input: './src/index.ts',
	output: { file: pkg.main, format: 'cjs', sourcemap: true },
	external: [...Object.keys(pkg.dependencies || {})],
	plugins: [
		resolve(),
		commonjs(),
		typescript({
			typescript: require('typescript'),
			abortOnError: true,
			useTsconfigDeclarationDir: false,
			tsconfigOverride: {
				compilerOptions: { declarationDir: 'lib' },
				include: ['src/**/*.ts'],
			},
		}),
	],
};
const browser = {
	input: './src/index.ts',
	output: { format: 'esm', file: pkg.module, sourcemap: true },
	external: [...Object.keys(pkg.dependencies || {})],
	plugins: [
		//replace({ './../node_modules/uuid/dist/esm-node/md5': `'blueimp-md5'`, delimiters: [`'`, `'`] }),
		resolve(),
		commonjs(),
		typescript({
			typescript: require('typescript'),
			abortOnError: true,
			useTsconfigDeclarationDir: false,
			tsconfigOverride: {
				compilerOptions: { declarationDir: 'lib/browser' },
				include: ['src/**/*.ts'],
			},
		}),
	],
};

module.exports = [node, browser];
