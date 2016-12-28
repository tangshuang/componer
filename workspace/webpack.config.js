import extend from "extend"
import {WebpackSupportCmdInUmd} from "./gulp/utils"

function webpack(options) {

	var defaults = {
		output: {
			libraryTarget: "umd",
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
	}

	var settings

	if(typeof options === "object") {
		settings = extend(true, defaults, options)
	}
	else {
		settings = defaults
	}

	if(settings.output.libraryTarget === "umd") {
		settings.plugins = settings.plugins || []
		settings.plugins.push(new WebpackSupportCmdInUmd())
	}

	return settings

}

export default webpack
module.exports = webpack