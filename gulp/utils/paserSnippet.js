import through from "through2"
import logger from "process.logger"
import {capitalName, camelName, dashlineName, separateName} from "../utils/nameConvert"

export default function paserSnippet(pairs) {
	return through.obj(function(file, endcoding, callback) {
		if(file.isNull()) {
			this.push(file)
			return callback()
		}

		if(file.isStream()) {
			logger().timestamp().error("gulp error: streaming not supported")
			return callback()
		}

		var content = file.contents.toString()
		if(pairs && typeof pairs === "object") {
			for(let key in pairs) {
				let value = pairs[key]
				var regCamelName = new RegExp("{{" + camelName(key) + "}}","g")
				var regCapitalName = new RegExp("{{" + capitalName(key) + "}}","g")
				var regDashlineName = new RegExp("{{" + dashlineName(key) + "}}","g")
				var regSeparateName = new RegExp("{{" + separateName(key) + "}}","g")
				var regSeparateCapitalName = new RegExp("{{" + separateName(key, true) + "}}", "g")

				content = content
					.replace(regCamelName, camelName(value))
					.replace(regCapitalName, capitalName(value))
					.replace(regDashlineName, dashlineName(value))
					.replace(regSeparateName, separateName(value))
					.replace(regSeparateCapitalName, separateName(value, true))
			}
		}

		file.contents = new Buffer(content)
		this.push(file)
		callback()
	})
}