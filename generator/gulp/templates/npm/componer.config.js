var packageJson = require('./package.json')

module.exports = {
	name: '{{componout-name}}',
	type: 'npm package',
	version: '0.0.1',
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
				library: '{{componout-name}}',
				get externals() {
					var deps = Object.keys(packageJson.dependencies)
					var externals = {}
					if(deps.length > 0) deps.forEach(dep => externals[dep] = dep)
					return externals
				},
			},
		}
	],
	test: {
		entry: 'test/{{componout-name}}.js',
		browsers: 'Terminal',
	},
}
