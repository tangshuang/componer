import through from "through2"

export default function(factory) {
	return through.obj(function(chunk, endcoding, callback) {
		if(chunk.isNull()) {
			this.push(chunk)
			return callback()
		}

		if(chunk.isStream()) {
			console.log("streaming not supported", "error")
			return callback()
		}

		var content = chunk.contents.toString()
		content = factory(content, chunk, this) || content

		chunk.contents = new Buffer(content)
		this.push(chunk)
		callback()
	})
}
