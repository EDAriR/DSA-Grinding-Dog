(function() {
	"use strict";
	var port = chrome.runtime.connect({name: "mtd_port"});
	port.onMessage.addListener(function(request) {
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
