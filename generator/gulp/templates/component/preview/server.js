module.exports = {
	route: "/test",
	handle: function (req, res, next) {
		res.end("Hello, Componer!")
		next()
	},
}
