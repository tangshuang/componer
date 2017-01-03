import extend from "extend"
import {ResolverPlugin} from "webpack"
import {WebpackSupportCmdInUmd} from "./gulp/utils"

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
			modulesDirectories: ["node_modules", "bower_components"],
		},
	}

	// -------------------------------------------------------------------

	var settings

	if(options && typeof options === "object") {
		settings = extend(true, defaults, options)
	}
	else {
		settings = defaults
	}


	/**
	 * insert default plugins
	 */

	settings.plugins = settings.plugins || []

	// support cmd in umd
	if(settings.output.libraryTarget === "umd") {
		settings.plugins.unshift(new WebpackSupportCmdInUmd())
	}

	// use bower.json main to be module entry
	settings.plugins.unshift(new ResolverPlugin(
        new ResolverPlugin.DirectoryDescriptionFilePlugin(".bower.json", ["main"])
    ))

	return settings

}