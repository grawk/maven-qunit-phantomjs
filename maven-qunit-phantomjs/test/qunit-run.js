/*
 * Commandline args
 */
var testConf = phantom.args[0];
var outputDir = phantom.args[1];
var page = new WebPage();
page.open("http://sfbay.craigslist.org",function(status) {
	if (status !== "success") {
		console.log("Unable to access network: " + testConf);
		phantom.exit(1);
	} else {
		console.log("success, now wait");
		waitFor(function() {
			return page.evaluate(function() {
				var el = document.getElementById('logo');
				if (el) {
					return true;
				}
				return false;
				console.log("false");
			});
		}, function() {
			/*var tests = page.evaluate(function() {
				var testLinks = document.querySelectorAll(".qunit-anchor");
				var tests = "";
				for ( var i = 0; i < testLinks.length; i++) {
					tests += (i == 0) ? testLinks[i].href : ","
							+ testLinks[i].href;
				}
				return tests;
			});*/
			page.content = "new content";
			console.log(page.evaluate(function() {return document.body.innerHTML}));
		});
	}
});
//phantom.exit(0);
function waitFor(testFx, onReady, timeOutMillis) {
	var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3001, // < Default
																	// Max
																	// Timout is
																	// 3s
	start = new Date().getTime(), condition = false, interval = setInterval(
			function() {
				if ((new Date().getTime() - start < maxtimeOutMillis)
						&& !condition) {
					// If not time-out yet and condition not yet fulfilled
					condition = (typeof (testFx) === "string" ? eval(testFx)
							: testFx()); // < defensive code
				} else {
					if (!condition) {
						// If condition still not fulfilled (timeout but
						// condition is 'false')
						console.log("'waitFor()' timeout");
						phantom.exit(1);
					} else {
						// Condition fulfilled (timeout and/or condition is
						// 'true')
						console.log("'waitFor()' finished in "
								+ (new Date().getTime() - start) + "ms.");
						typeof (onReady) === "string" ? eval(onReady)
								: onReady(); // < Do what it's supposed to do
												// once the condition is
												// fulfilled
						clearInterval(interval); // < Stop this interval
					}
				}
			}, 100); // < repeat check every 250ms
};

