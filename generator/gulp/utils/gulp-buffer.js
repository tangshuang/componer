import through from 'through2'

export default function(factory) {
	return through.obj(function(file, endcoding, callback) {
		if(file.isNull()) {
			this.push(file)
			callback()
			return
		}

		if(file.isStream()) {
			console.log('streaming not supported')
			callback()
			return
		}

		var content = file.contents.toString()
		content = factory(content, file, this) || content

		file.contents = new Buffer(content)
		this.push(file)
		callback()
	})
}
