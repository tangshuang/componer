import extend from "extend"

module.exports = function(options) {
	var defaults = {
		output: {
			filename: "index.js",
			library: "",
			libraryTarget: "umd",
			sourceMapFilename: "",
		},
		externals: {
		},
		module: {
			loaders: [
				{
					test: /\.js$/, 
					loader: "babel?presets[]=latest",
				},
				{
					test: /^(?:(?!http).)*\.scss$/,
					loader: "style!css!sass",
				},
				{
					test: /^(?:(?!http).)*\.css$/,
					loader: "style!css",
				},
				{
					test: /\.jpg$/,
					loader: "file",
				},
				{
					test: /\.svg$/,
					loader: "url?limit=15000&mimetype=image/svg+xml",
				},
				{
					test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
					loader: "url?limit=100000&minetype=application/x-font-woff",
				},
				{
					test: /\.png$/,
					loader: "url?limit=15000&mimetype=image/png",
				},
				{
					test: /\.html$/,
					loader: "html?attrs=img:src input:src",
				},
			],
		},
		resolve: {
			packageAlias: "bowerComponents",
		},
		target: "web",
		devtool: "source-map",
	}

	return extend(true, {}, defaults, options)
}