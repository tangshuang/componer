/**
 * pipe plugin
 */

import {prettyHtml, getFileExt, modifyStreamContent} from "./index"

export function InjectToHtml(label, html) {
	return modifyStreamContent(content => {
		var reg = new RegExp("(<!--\s*?" + label + ":\s*?-->)([\\s\\S]*?)(<!--\s*?:" + label + "\s*?-->)", "im")
		content = content.replace(reg, "$1" + html + "$3")
		content = prettyHtml(content)

		return content
	})
}

export function InjectJsToHtml(label, files) {
	var html = ""
	if(Array.isArray(files)) {
		html = files.map(file => `<script src="${file}"></script>`).join("")
	}
	else if(typeof files === "string") {
		html = `<script src="${files}"></script>`
	}
	return InjectToHtml(label, html)
}

export function InjectCssToHtml(label, files) {
	var html = ""
	if(Array.isArray(files)) {
		html = files.map(file => `<link rel="stylesheet" href="${file}">`).join("")
	}
	else if(typeof files === "string") {
		html = `<link rel="stylesheet" href="${files}">`
	}
	return InjectToHtml(label, html)
}