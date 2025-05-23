(function() {
	"use strict";

	var gfm = turndownPluginGfm.gfm
	var turndownService = new TurndownService({
		headingStyle: "atx",
		hr: "* * *",
		bulletListMarker: "-",
		codeBlockStyle: "indented",
		fence: "```",
		emDelimiter: "*",
		strongDelimiter: "**",
		linkStyle: "inlined",
		linkReferenceStyle: "full"
		});
	turndownService.use(gfm);
	turndownService.remove("script").remove("style");

	turndownService.addRule("mkdItalic", {
		filter: (node) => "italic" === node.getAttribute("data-mkd-emph"),
		replacement: (content, node, options) => options.emDelimiter + content + options.emDelimiter
		});
	turndownService.addRule("mkdBold", {
		filter: (node) => "bold" === node.getAttribute("data-mkd-emph"),
		replacement: (content, node, options) => options.strongDelimiter + content + options.strongDelimiter
		});


	window.html2mk = function(dom) {

		// prep: mark elements to be modified
		walkIt(dom, prep);

		// todo: implement options for this
		/*
		[...dom.querySelectorAll("[data\\-mkd\\-tableHasHeader=false]")].forEach(function(el) {
			var thead = document.createElement("thead");
			el.prepend(thead);
			thead.appendChild(el.rows[0]);
			});
		*/
		//console.log(dom.innerHTML);

		// run turndown on prepared content
		var mkstr = turndownService.turndown(dom);
		// and send the result as dom and string
		return {dom: dom, str: mkstr};
		}

	var walkIt = function walk(node, func) {
		func(node);
		node = node.firstChild;
		while (node) {
			walk(node, func);
			node = node.nextSibling;
			}
		};

	var prep = (function() {
		var	liIndex, trIndex, tdIndex = 0;
		return function(node) {
			// only analyze element nodes (not attributes, text or comment)
			if (node.nodeType != Node.ELEMENT_NODE) return;
			// we put the display type here based on the node name
			var	displayType = node.matches(mku.elts.inline) ? "inline" : "block";
			node.setAttribute("data-mkd-display", displayType);
			// inline elements enrichment
			if (displayType == "inline") {
				// preprocessing not extremely useful but feels somehow cleaner?
				// (originally we marked elements and then wrapped them in other elements but modifying the dom is bad)
				if (node.style.fontWeight == "bold" || parseInt(node.style.fontWeight, 10) >= 700) {
					node.setAttribute("data-mkd-emph", "bold");
					}
				if (node.style.fontStyle == "italic") {
					node.setAttribute("data-mkd-emph", "italic");
					}
				}
			// block elements analysis
			else {
				if (node.matches("ul,ol")) {
					var listDepth = 1;
					if (node.parentNode.closest("ul,ol")) {
						listDepth = +node.parentNode.closest("ul,ol").getAttribute("data-mkd-depth") + 1;
						}
					node.setAttribute("data-mkd-depth", listDepth);
					liIndex = 0;
					}
				else if (node.matches("li")) {
					liIndex++;
					node.setAttribute("data-mkd-index", liIndex);
					}
				else if (node.matches("table")) {
					trIndex = 0;
					var tableHasHeader = isHeadingRow(node.rows[0]) ? true : false;
					node.setAttribute("data-mkd-tableHasHeader", tableHasHeader);
					}
				else if (node.matches("tr")) {
					tdIndex = 0;
					trIndex++;
					node.setAttribute("data-mkd-index", trIndex);
					node.setAttribute("data-mkd-index-row", trIndex);
					}
				else if (node.matches("td,th")) {
					tdIndex++;
					node.setAttribute("data-mkd-index", tdIndex);
					node.setAttribute("data-mkd-index-cell", tdIndex);
					if (!node.nextElementSibling) {
						node.setAttribute("data-mkd-pos", "last");
						}
					}
				}
			}
		}());



/* copied directly from turndown-plugin-gfm to be used as a test
to add a header to tables that lack one */

	var every = Array.prototype.every;

	// A tr is a heading row if:
	// - the parent is a THEAD
	// - or if its the first child of the TABLE or the first TBODY (possibly
	//   following a blank THEAD)
	// - and every cell is a TH
	function isHeadingRow (tr) {
	  var parentNode = tr.parentNode;
	  return (
	    parentNode.nodeName === 'THEAD' ||
	    (
	      parentNode.firstChild === tr &&
	      (parentNode.nodeName === 'TABLE' || isFirstTbody(parentNode)) &&
	      every.call(tr.childNodes, function (n) { return n.nodeName === 'TH' })
	    )
	  )
	}

	function isFirstTbody (element) {
	  var previousSibling = element.previousSibling;
	  return (
	    element.nodeName === 'TBODY' && (
	      !previousSibling ||
	      (
	        previousSibling.nodeName === 'THEAD' &&
	        /^\s*$/i.test(previousSibling.textContent)
	      )
	    )
	  )
	}
/* end of turndown-plugin-gfm copy */



	})();