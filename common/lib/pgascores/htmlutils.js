/**
 * toText
 * Collapse an html node tree into just its text elements
 *
 * @el : a JQuery selector returned element tree
 * @returns: a string of text from inside the elements
 */
exports.toText = function( el ) {
	var str = "";
	if (el.type == 'text') {
		str = el.data;
	} else if (el.type == 'tag') {
		if (el.children != undefined) {
			for (var i=0; i<el.children.length; i++) {
				var strChildren = exports.toText(el.children[i]);

				str += strChildren;
			}
		}
	}

	return str;
};

