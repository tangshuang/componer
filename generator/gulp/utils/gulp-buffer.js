import through from 'through2'

export default function(factory) {
	return through.obj(function(file, endcoding, callback) {
		if(file.isNull()) {
			this.push(file)
			return callback()
		}

		if(file.isStream()) {
			console.log('streaming not supported', 'error')
			return callback()
		}

		var content = file.contents
		content = factory(content.toString(), file, this) || content

		file.contents = new Buffer(content)
		this.push(file)
		callback()
	})
}
