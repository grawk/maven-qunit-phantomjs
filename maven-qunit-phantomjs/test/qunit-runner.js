/*
 * Commandline args
 */
var testConf = phantom.args[0];
var outputDir = phantom.args[1];
var tests = [];
var page = new WebPage();
var fs = require('fs');
var results = "QUnit Test Report\n\n";
var stamp = new Date().getTime();
var outputFile = 'qunit-output-' + stamp + '.txt';
var success = true;
var failRE = /[1-9]{1,}[0]{0,}\sfailed/;
/**
 * Wait until the test condition is true or a timeout occurs. Useful for waiting
 * on a server response or for a ui change (fadeIn, etc.) to occur.
 * 
 * @param testFx
 *            javascript condition that evaluates to a boolean, it can be passed
 *            in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or as
 *            a callback function.
 * @param onReady
 *            what to do when testFx condition is fulfilled, it can be passed in
 *            as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or as a
 *            callback function.
 * @param timeOutMillis
 *            the max amount of time to wait. If not specified, 3 sec is used.
 */
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

if (phantom.args.length === 0 || phantom.args.length > 2) {
	console.log('Usage: run-qunit.js URL');
	phantom.exit(1);
}

// Route "console.log()" calls from within the Page context to the main Phantom
// context (i.e. current "this")
page.onConsoleMessage = function(msg) {
	console.log(msg);
};
page.open(testConf, function(status) {
	if (status !== "success") {
		console.log("Unable to access network: " + testConf);
		phantom.exit(1);
	} else {
		waitFor(function() {
			return page.evaluate(function() {
				var el = document.getElementById('qunit-testlist');
				if (el) {
					return true;
				}
				return false;
			});
		}, function() {
			var tests = page.evaluate(function() {
				var testLinks = document.querySelectorAll(".qunit-anchor");
				var tests = "";
				for ( var i = 0; i < testLinks.length; i++) {
					tests += (i == 0) ? testLinks[i].href : ","
							+ testLinks[i].href;
				}
				return tests;
			});
			phantom.tests = tests.split(",");
			runTests();
		});
	}
});
function runTests() {
	// run first test in "tests" array, then unshift the array
	var currentTest = phantom.tests.shift();
	if (currentTest === undefined) {
		// console.log("full results:::"+phantom.results);
		console.log("attempt to write to:" + outputDir + '/' + outputFile);
		var f = fs.open(outputDir + '/' + outputFile, "w");
		f.write(results);
		f.close();
		phantom.exit((success) ? 0 : 1);
	}
	console.log("run test: " + currentTest);

	// run test
	page.open(currentTest, function(status) {
		if (status !== "success") {
			console.log("Unable to access network");
			phantom.exit(1);
		} else {
			waitFor(function() {
				return page.evaluate(function() {
					var el = document.getElementById('qunit-testresult');
					if (el && el.innerText.match('completed')) {
						return true;
					}
					return false;
				});
			}, function() {
				var screenShotName = outputDir+"/"+currentTest;
				var res = page.evaluate(function() {
					var el = document.getElementById('qunit-testresult');
					// console.log(el.innerText);
					try {
						return el.innerText;
					} catch (e) {
					}
					return "FAIL FAIL FAIL";
				});
				if (failRE.test(res)) {
					success = false;
					screenShotName += "-FAIL";
				}
				results += currentTest + '\n'
				results += res;
				results += '\n*~*~*~*~*~\n';
				page.render(screenShotName + '.png');
				runTests();
			});
		}
	});

}
