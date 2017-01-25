export default function(app) {
	app.use("/test", (req, res, next) => {
		res.end("ok")
	})
}
