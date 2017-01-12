import extend from "extend"
import {WebpackSupportCmdInUmd} from "./gulp/utils"
import BowerWebpackPlugin from "bower-webpack-plugin"

export default function webpack(options) {

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
			packageAlias: "packageAlias",
		},
		// devtool: "source-map",
	}

	// -------------------------------------------------------------------

	var settings

	if(options && typeof options === "object") {
		settings = extend(true, defaults, options)
	}
	else {
		settings = defaults
	}

	// support cmd in umd
	if(settings.output.libraryTarget === "umd") {
		settings.plugins = settings.plugins || []
		settings.plugins.unshift(new WebpackSupportCmdInUmd())
	}

	settings.plugins.unshift(new BowerWebpackPlugin())

	return settings
	
}