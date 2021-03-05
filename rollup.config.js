import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import pluginJSON from '@rollup/plugin-json'

export default {
		input: 'src/index.js',
		output: { file: 'dist/bundle.js', format: 'cjs' },
		plugins: [
			pluginJSON(),
			resolve(), // so Rollup can find `ms`
			commonjs() // so Rollup can convert `ms` to an ES module
		]
}
