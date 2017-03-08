import extend from 'extend'
import WebPackPluginBower from 'bower-webpack-plugin'
import WebPackPluginCMD from '../utils/webpack-plugin-cmd'

export default function webpack(settings) {
	var defaults = {
		output: {
			libraryTarget: 'umd',
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
			loader: 'babel?presets[]=latest',
		},
		{
			test: /^(?:(?!http).)*\.scss$/,
			loader: 'style!css!sass',
		},
		{
			test: /^(?:(?!http).)*\.css$/,
			loader: 'style!css',
		},
		{
			test: /\.jpe?g$|\.gif$|\.png$|\.svg$|\.woff$|\.ttf$|\.wav$|\.mp3$/,
			loader: 'file',
		},
		{
			test: /\.svg$/,
			loader: 'url?limit=15000&mimetype=image/svg+xml',
		},
		{
			test: /\.html$/,
			loader: 'html?attrs=img:src input:src',
		},
		{
			test: /\.jade$/,
			loader: 'jade',
		},
		{
			test: /\.hbs$/,
			loader: 'handlebars',
		},
		{
			test: /\.json$/,
			loader: 'json',
		},
	])
	settings.plugins = settings.plugins.concat([
		new WebPackPluginBower({
			modulesDirectories: 'bower_components',
			searchResolveModulesDirectories: false,
			includes: /.*\.js/,
		}),
		new WebPackPluginCMD(),
	])

    return settings
}
