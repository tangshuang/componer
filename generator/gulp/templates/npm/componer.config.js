var packageJson = require('./package.json')
var deps = Object.keys(packageJson.dependencies)
var externals = {}
if(deps.length > 0) deps.forEach(dep => externals[dep] = dep)

module.exports = {
	name: '{{componout-name}}',
	type: 'npm',
	build: [
		{
			from: 'src/{{componout-name}}.js',
			to: 'dist/{{componout-name}}.js',
			driver: 'webpack',
			options: {
				minify: false,
				sourcemap: false,
			},
			settings: {
				output: {
					library: '{{ComponoutName}}',
					libraryTarget: 'commonjs2',
				},
				target: 'node',
				node: {
					global: false,
					Buffer: false,
				},
				externals: externals,
			},
		}
	],
	test: {
		entry: 'test/{{componout-name}}.js',
		browsers: 'Terminal',
	},
}
