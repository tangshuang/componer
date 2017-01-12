/**
 * webpack plugin
 */

import RawSource from "webpack/lib/RawSource"

export function modifyWebpackContent(modify) {
	function WebpackContent() {}
	WebpackContent.prototype.apply = function(compiler) {

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

				content = modify(content) || content

				assets[key] = new RawSource(content)
			})

			callback()

		})

	}
	return WebpackContent
}

var WebpackSupportCmdInUmd = modifyWebpackContent(content => {
	content = content
		.replace("typeof define === 'function' && define.amd", "typeof define === 'function' && define.amd && define.cmd")
		.replace('"function"==typeof define&&define.amd', '"function"==typeof define&&define.amd&&define.cmd')
	return content
})

var WebpackSupportCrypto = modifyWebpackContent(content => {
	content = content.replace("_crypto =", "var _crypto =")
	return content
})

export {WebpackSupportCmdInUmd, WebpackSupportCrypto}