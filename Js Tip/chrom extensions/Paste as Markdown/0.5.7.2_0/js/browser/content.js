(function() {
	"use strict";
	var	debug = 0; // todo debug in options
	chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
		debug > 0 && console.log(msg);
		if (msg.command === "checkStatus") {
			sendResponse({status: "loaded"});
			}
		});

	var port = chrome.runtime.connect({name: "mtd_port"});
	port.onMessage.addListener(function(request) {
		debug > 0 && console.log(request);
		if (!document.hasFocus()) {
			return;
			}
		else if(request.command === "paste-mk") {
			// fails silently if not in an editable
			document.execCommand("insertText", false, request.data);
			}
		else {
			console.warn("unknown command", request);
			}
		return true;
		});
	
	})();
