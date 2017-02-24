var bowerJson = require("./bower.json")
var packageJson = require("./package.json")

module.exports = {
	name: "{{componout-name}}",
	type: "component",
	version: "0.0.1",
	build: [
		{
			from: "src/script/{{componout-name}}.js",
			to: "dist/js/{{componout-name}}.js",
			driver: "webpack",
			options: {
				minify: true,
				sourcemap: "file",
			},
			settings: {
				get externals() {
					var deps = Object.keys(bowerJson.dependencies).contact(Object.keys(packageJson.dependencies))
					var externals = {}
					if(deps.length > 0) deps.forEach(dep => externals[dep] = dep)
					return externals
				},
			},
		},
		{
			from: "src/style/{{componout-name}}.scss",
			to: "dist/css/{{componout-name}}.css",
			driver: "sass",
			options: {
				minify: true,
				sourcemap: "file",
			},
		},
	],
	preview: {
		index: "preview/index.html",
		script: "preview/{{componout-name}}.js",
		style: "preview/{{componout-name}}.scss",
		server: "preview/server.js",
		watchFiles: [
			"preview/index.html",
			"preview/{{componout-name}}.js",
			"preview/{{componout-name}}.scss",
			"src/**/*",
		],
	},
	test: {
		entry: "test/specs/{{componout-name}}.js",
		reporters: "test/reporters",
		debug: false,
		browsers: ["PhantomJS"],
	},
}
