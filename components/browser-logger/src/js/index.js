var _messages = []
var _colors = []
var _method = "log"
var _data = {}

function Logger(msg, style, method) {
	if(msg) {
		Logger.set(method).put(msg, style).print()
	}

    return Logger
}

Logger.set = function(method = "log") {
	_method = method
	return Logger
}

Logger.put = function(msg, style = "") {
	_messages.push("%c" + msg)
	_colors.push(style)
	return Logger
}

Logger.print = function() {
	var message = [_messages.join(" ")].concat(_colors)
    console[_method].apply({},message)

    _messages = []
	_colors = []
	_method = "log"
}

Logger.data = function(data) {
	_data = data
	return Logger
}

Logger.error = function(code, style) {
    var msg = _data[code]
    return Logger(msg, style, "error")
}

Logger.warn = function(code, style) {
    var msg = _data[code]
    return Logger(msg, style, "warn")
}

Logger.info = function(code, style) {
    var msg = _data[code]
    return Logger(msg, style, "info")
}

Logger.log = function(code, style) {
	var msg = _data[code]
    return Logger(msg, style, "log")
}

export default Logger
module.exports = Logger