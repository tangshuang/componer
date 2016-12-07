import extend from "extend"

module.exports = function(options) {
	var defaults = {
		output: {
			filename: "",
			library: "",
			libraryTarget: "umd",
		},
		externals: {
		},
		module: {
			loaders: [
				{
					test: /\.js$/, 
					loaders: ["babel?presets[]=latest"],
				},
				{
					test: /^(?:(?!http).)*\.scss$/,
					loader: "style!css!sass"
				},
				{
					test: /^(?:(?!http).)*\.css$/,
					loader: "style!css"
				},
				{
					test: /\.jpg$/,
					loader: "file"
				},
				{
					test: /\.svg$/,
					loader: "url?limit=15000&mimetype=image/svg+xml"
				},
				{
					test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
					loader: "url?limit=100000&minetype=application/x-font-woff"
				},
				{
					test: /\.png$/,
					loader: "url?limit=15000&mimetype=image/png"
				},
				{
					test: /\.html$/,
					loader: "html?attrs=img:src input:src"
				},
			],
		},
	}

	return extend(true, {}, defaults, options)
}