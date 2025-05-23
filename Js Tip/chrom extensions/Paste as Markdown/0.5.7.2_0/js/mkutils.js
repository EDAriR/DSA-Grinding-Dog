

const	mku = {
	escape: function(str) {
//		return string.replace(/[`*_{}[\]()#+-;!\\]/g, '\\$&');
		// todo: some escapes should only be escaped when there is a blank before them (risk of confusion with control chars)
		return str.replace(/[`*_#\\]/g, '\\$&');
		},
	// todo cleanup: before current function, for each line, if it only contains spaces, replace by \n
	clean: function(str) {
		return str.replace(/^\s+/g, "").replace(/\n /g, "\n").replace(/\n{2,}/g, "\n\n");
		},
	wrap: function(el, wrapper) {
		el.parentNode.insertBefore(wrapper, el);
		wrapper.appendChild(el);
		},
	elts: {
		inline: "b, big, i, small, tt, abbr, acronym, cite, code, dfn, em, kbd, strong, samp, var, a, bdo, span, sub, sup, br",
		block: "p, div, h1, h2, h3, h4, h5, h6, ol, ul, dl, li, pre, address, blockquote, fieldset, form, hr, table, th, tr, td, noscript",
		// technically inline, but not for me
		other: "img, map, object, q, script, button, input, label, select, textarea"
		}
	}



_.mixin({
	"contains": function(hay, needle) {
		return _.indexOf(_.words(hay), needle) > -1 ? true : false;
		}
	});


	/*
	todo: escape reserved chars

	\   backslash
	`   backtick
	*   asterisk
	_   underscore
	{}  curly braces
	[]  square brackets
	()  parentheses
	#   hash mark
	+   plus sign
	-   minus sign (hyphen)
	.   dot
	!   exclamation mark
	*/