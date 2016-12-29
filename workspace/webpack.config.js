import extend from "extend"
import webpack from "webpack"
import RawSource from "webpack/lib/RawSource"


/**
 * define a plugin
 */

function WebpackSupportCmdInUmd() {}

WebpackSupportCmdInUmd.prototype.apply = function(compiler) {

  compiler.plugin("emit", (compilation, callback) => {

    if(compilation.options.output.libraryTarget !== "umd") {
      return
    }

    let outputfile = compilation.options.output.filename
    let assets = compilation.assets
    let keys = Object.keys(assets) 
    
    keys.forEach(key => {
      if(outputfile !== key || outputfile.substr(outputfile.lastIndexOf('.')) !== ".js") {
        return
      }

      let asset = assets[key]
      let content = asset.source()

      content = content.replace("typeof define === 'function' && define.amd", "typeof define === 'function' && define.amd && define.cmd")
        .replace('"function"==typeof define&&define.amd', '"function"==typeof define&&define.amd&&define.cmd')
      
      assets[key] = new RawSource(content)
    })

    callback()

  })

}


/**
 * config function
 */

function webpackConfig(options) {

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
			modulesDirectories: ["node_modules", "bower_components"],
		},
	}

	var settings

	if(typeof options === "object") {
		settings = extend(true, defaults, options)
	}
	else {
		settings = defaults
	}


	/**
	 * insert default plugins
	 */

	settings.plugins = settings.plugins || []
	// use bower.json main to be module entry
	settings.plugins.unshift(new webpack.ResolverPlugin(
        new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin(".bower.json", ["main"])
    ))
	// support cmd in umd
	if(settings.output.libraryTarget === "umd") {
		settings.plugins.unshift(new WebpackSupportCmdInUmd())
	}

	return settings

}

export default webpackConfig
module.exports = webpackConfig