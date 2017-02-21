module.exports = {
	name: "{{componout-name}}",
	build: [
		{
			from: "src/script/{{componout-name}}.js",
			to: "dist/js/{{componout-name}}.js",
			options: {
				minify: true,
				sourcemap: "file",
			},
		},
		{
			from: "src/style/{{componout-name}}.scss",
			to: "dist/css/{{componout-name}}.css",
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
		watch: [
			"preview/index.jade",
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
