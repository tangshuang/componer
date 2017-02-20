import extend from "extend"
import {WebpackSupportCmdInUmd} from "./gulp/utils"
import BowerWebpackPlugin from "bower-webpack-plugin"

export default function webpack(options) {

	var defaults = {
		output: {
			libraryTarget: "umd",
		},
		module: {
			preLoaders: [],
			loaders: [],
		},
		resolve: {
			packageAlias: "packageAlias",
		},
		plugins: [],
	}

	var settings = defaults
    if(options && typeof options === "object") {
        extend(true, settings, options)
    }

    settings.module.loaders = settings.module.loaders.concat([
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
	])
	settings.plugins = settings.plugins.concat(new BowerWebpackPlugin())

	if(settings.output.libraryTarget === "umd") {
		settings.plugins = settings.plugins.concat(new WebpackSupportCmdInUmd())
	}

    return settings
	
}