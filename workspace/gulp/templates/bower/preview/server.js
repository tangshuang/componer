export default function(app) {
	app.use("/test", function(req, res, next) {
		res.end("ok")
	})
}