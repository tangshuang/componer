var packageJson = require("./package.json")

module.exports = {
	"name": "{{componout-name}}",
	"build": [
		{
			"from": "src/{{componout-name}}.js",
			"to": "dist/{{componout-name}}.js",
			"options": {
				"minify": false,
				"sourcemap": false,
			},
			"settings": {
				"externals": function() {
					var deps = Object.keys(packageJson.dependencies)
					var externals = {}
					if(deps.length > 0) deps.forEach(dep => externals[dep] = dep)
					return externals
				} (),
			},
		}
	],
	"test": {
		"entry": "test/specs/{{componout-name}}.js",
		"browsers": ["Terminal"],
	},
}
