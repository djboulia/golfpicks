/**
 *
 * helpful functions for mangling player names
 *
 **/
/**
 *	normalize	: turn a name into a searchable entity
 *
 * convert player name into a normalized version we can use as a unique id
 *
 * remove all commas and periods
 * convert hyphens and spaces to underscores
 * make the name lower case
 * The string "Ted Jones-Davis, Jr." would becomes "ted_jones_davis_jr"
 *
 *
 *	@str 		: the string with the player's name
 *  @returns	: the normalized string
 */
exports.normalize = function( str ) {
	str = str.replace( /,/g, '');	// remove any commas
	str = str.replace( /\./g, '');	// remove any periods
	str = str.replace( /-/g, '_');	// replace hyphens with underscores
	str = str.replace( /\s/g, '_');	// spaces with underscores
	str = str.toLowerCase();
	return str;
};

/**
 * expects Last,<sp>First format and will return First<sp>Last
 **/
exports.reverseName = function( str ) {
    var parts = str.split(",");
    return parts[1].trim() + " " + parts[0].trim();
}

