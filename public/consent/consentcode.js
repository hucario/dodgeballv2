// ~~ snip ~~
var analyticsCookieName = 'analytics cookie - only used for unique visitor count.';
var dontShowConsentCookie = "Don't show consent question";
// ~~ snip ~~
function wrappedRender(req, res, path, obj) {
	if (!obj) {
		obj = {};
	}
	visits++;
	let showConsentQuestion = false;
	if (req.cookies && req.cookies[dontShowConsentCookie] == undefined) {
		showConsentQuestion = true;
		res.cookie(dontShowConsentCookie, true, {'Max-Age': Date.now() + 18144000000}); // 1 month
	}
	
	obj.showConsentQuestion = (obj.showConsentQuestion!=undefined?obj.showConsentQuestion:showConsentQuestion);
	res.render(path, obj);
}
// ~~ snip ~~
app.get('/consent/trackme', (req,res) => {
	res.cookie(analyticsCookieName,Math.random());
	uniqueVisitors++;
	res.send('Thanks :)');
});
