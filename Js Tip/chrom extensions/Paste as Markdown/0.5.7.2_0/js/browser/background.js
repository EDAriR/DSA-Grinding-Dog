(function() {
	"use strict";
	var tabId;
	var debug = 0; // todo debug in options

	// get id of tab when activated, avoiding to have to query tabs later
	chrome.tabs.onActivated.addListener(function(info) {
    	tabId = info.tabId;
	    });

//	chrome.runtime.onInstalled.addListener(function() {
		chrome.contextMenus.create({
			id: "paste-mk",
			title: "Paste as Markdown",
			contexts: ["editable"]
			});
//		});

	// listens to commands from keyboard shortcuts and context menu
	// (they don't have the same format (!!))
	chrome.commands.onCommand.addListener(transform);
	chrome.contextMenus.onClicked.addListener(transform);

	function transform(info) {
		var commandName = _.isString(info) ? info : info.menuItemId; 
		if (commandName === "paste-mk") {
			loadScr()
				.then(getRichTextFromClipboard)
				.then(launchMkTransform)
				.then(data => dispatch(data, commandName))
				.catch(console.warn);
			}
		else {
			console.warn("unknown command");
			}
		}

	// upon each connection from a page with content.js, sets up a port of communications
	chrome.runtime.onConnect.addListener(function(port) {
		// ... and sends it the result of the transformation
		// (so the result is sent to every page, which decides to act on it or not)
		document.body.addEventListener("mtd_command", function(evt) {
			var	commandName = evt.detail.command;
			var	data = evt.detail.data;
			if (commandName === "paste-mk") {
				try {
					port.postMessage({command: commandName, data: data});
					}
				catch(err) {
					// catch error when port is closed
					// port is closed when a tab is closed / reloaded
					// and when the popup is closed
					void err;
					}
				}
			else {
				console.warn("unknown command", evt);
				}
			});
		});

	// script injection into activeTab has to happen as a consequence of a user action
	// (in this case, an command); if we wanted to use chrome.tabs.onActivated then
	// we would need broad permissions, which we are looking to avoid.
	function loadScr() {
		return new Promise(function(resolve, reject) {
			try {
				chrome.tabs.sendMessage(tabId, {command: "checkStatus"}, function(msg) {
					void	chrome.runtime.lastError;
					msg = msg || {};
					debug > 0 && console.log(msg);
					if (msg.status !== "loaded") {
						// chrome.runtime.lastError is to avoid an error in the console
						// the only error that should happen is if the active tab is with the chrome: protocol
						// (could be other errors if appropriate permissions are not set)
						chrome.tabs.executeScript(tabId, {file: "js/browser/content.js", allFrames: true}, function() {
							void chrome.runtime.lastError;
							resolve("script has been loaded");
							});
						}
					else {
						resolve("script is already loaded");
						}
					});
				}
			catch(e) {
				// can happen when changing app paramenters, such as fileURLs access
				// and then using the popup
				resolve("unknown pb, try to continue anyway");
				debug > 0 && console.warn(e);
				}
			});
		}

	function dispatch(data, commandName) {
		return new Promise(function(resolve, reject) {
			var msg = {command: commandName, data: data}
			var evt = new CustomEvent("mtd_command", {
				detail: msg
				});
			document.body.dispatchEvent(evt);
			resolve(data);
			});
		}

	// get rich text from clipboard by pasting it inside a contenteditable
	// and getting the innerhmtl
	function getRichTextFromClipboard() {
		return new Promise(function(resolve, reject) {
			const	zoneForPaste = document.createElement("div");
			zoneForPaste.setAttribute("contenteditable", true);
			document.body.appendChild(zoneForPaste);
			zoneForPaste.focus({preventScroll:true});
			document.execCommand("paste");
			const 	result = zoneForPaste.innerHTML;
			document.body.removeChild(zoneForPaste);
			debug > 0 && console.log(result);
			resolve(result);
			});
		}

	function launchMkTransform(html) {
		return new Promise(function(resolve, reject) {
			if (!html) throw new TypeError("empty html");
			const	parser = new DOMParser();
			const	domfull = parser.parseFromString(html, "text/html");
			const	dom = domfull.getElementsByTagName("body").item(0);
			if (!dom) throw new TypeError("dom construction failed");

			const	res = html2mk(dom);
			const 	contentReturn = res.str;
			const	logRes = {html: html, ndom: res.dom, nhtml: res.dom.outerHTML, str: contentReturn}
			debug > 1 && console.log(logRes);
			resolve(res.str);
			});
		}

	})();

