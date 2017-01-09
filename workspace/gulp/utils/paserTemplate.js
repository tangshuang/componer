/**
 * pipe plugin
 */
 
import {capitalName, camelName, dashlineName, separateName, modifyStreamContent} from "./index"

export function PaserTemplate(pairs) {
	return modifyStreamContent(content => {
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
		return content
	})
}