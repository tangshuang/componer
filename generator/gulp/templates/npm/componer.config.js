module.exports = {
	name: '{{componout-name}}',
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
					libraryTarget: 'commonjs2',
				},
				target: 'node',
				node: {
					global: false,
					Buffer: false,
				},
				externals: getExternals(),
			},
		}
	],
	test: {
		entry: 'test/{{componout-name}}.js',
		browsers: 'Terminal',
	},
}

function getExternals() {
	var packageJson = require('./package.json')
	var deps = Object.keys(packageJson.dependencies)
	var externals = {}
	if(deps.length > 0) deps.forEach(dep => externals[dep] = dep)
	return externals
}
