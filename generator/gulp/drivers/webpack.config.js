import extend from 'extend'
import WebPackPluginBower from 'bower-webpack-plugin'
import Bufferify from 'webpack-bufferify'

class WebPackPluginCMD extends Bufferify {
    process(content, file, assets, compilation) {
        if(compilation.options.output.libraryTarget === 'umd') {
            content = content
                .replace("typeof define === 'function' && define.amd", "typeof define === 'function' && define.amd && define.cmd")
                .replace('"function"==typeof define&&define.amd', '"function"==typeof define&&define.amd&&define.cmd')
        }
        return content
    }
}

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
		},
		externals: [],
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
			loader: 'url-loader',
			query: {
				limit: 15000,
				mimetype: 'image/svg+xml',
			},
		},
		{
			test: /\.html$/,
			loader: 'html-loader',
			query: {
				attrs: 'img:src input:src',
			},
		},
		{
			test: /\.jade|\.pug$/,
			loader: 'pug-loader',
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
