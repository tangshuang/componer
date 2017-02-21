import RawSource from "webpack/lib/RawSource"
export default function(factory) {
    return function(compiler) {
		compiler.plugin("emit", (compilation, callback) => {
			let assets = compilation.assets
			let keys = Object.keys(assets)
			keys.forEach(key => {
                if(outputfile !== key || outputfile.substr(outputfile.lastIndexOf('.')) !== ".js") {
                    return
                }

				let asset = assets[key]
				let content = asset.source()

				content = factory(content, key, compilation) || content

				assets[key] = new RawSource(content)
			})
			callback()
		})
	}
}
