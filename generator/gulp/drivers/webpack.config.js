import extend from 'extend'
import WebPackPluginBower from 'bower-webpack-plugin'
import WebPackPluginCMD from '../utils/webpack-plugin-cmd'

export default function(settings) {
	var defaults = {
		output: {
			libraryTarget: 'umd',
		},
		module: {
			preLoaders: [],
			loaders: [],
		},
		resolve: {
			modulesDirectories: [
				'node_modules',
				'componouts',
			],
			extensions: [
				'.js',
				'.jsx',
				'.coffee',
				'.ts',
			],
		},
		plugins: [],
	}

    settings = extend(true, {}, defaults, settings)
    settings.module.loaders = settings.module.loaders.concat([
		{
			test: /\.js$/,
			loader: 'babel-loader',
		},
		{
			test: /^(?:(?!http).)*\.scss$/,
			loader: 'style-loader!css-loader!sass-loader',
		},
		{
			test: /^(?:(?!http).)*\.css$/,
			loader: 'style-loader!css-loader',
		},
		{
			test: /\.jpe?g$|\.gif$|\.png$|\.svg$|\.woff$|\.ttf$|\.wav$|\.mp3$/,
			loader: 'file-loader',
		},
		{
			test: /\.svg$/,
			loader: 'url-loader?limit=15000&mimetype=image/svg+xml',
		},
		{
			test: /\.html$/,
			loader: 'html-loader?attrs=img:src input:src',
		},
		{
			test: /\.jade$/,
			loader: 'jade-loader',
		},
		{
			test: /\.hbs$/,
			loader: 'handlebars-loader',
		},
		{
			test: /\.json$/,
			loader: 'json-loader',
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
