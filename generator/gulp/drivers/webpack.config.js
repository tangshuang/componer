import extend from "extend"
import WebpackPluginBower from "bower-webpack-plugin"
import WebpackPluginCmd from "./webpack.plugin.cmd"

export default function webpack(settings) {
	var defaults = {
		output: {
			libraryTarget: "umd",
		},
		module: {
			preLoaders: [],
			loaders: [],
		},
		plugins: [],
	}

    settings = extend(true, {}, defaults, settings)
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
	settings.plugins = settings.plugins.concat([
		new WebpackPluginBower(),
		new WebpackPluginCmd(),
	])

    return settings
}
