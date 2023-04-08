const GameUtils = function () {

    var endOfDay = function (timems) {
        // convert timems to end of the current day.
        // this will give us a grace period for comparisons
        var eod = new Date(timems);

        eod.setHours(23, 59, 59, 999);

        return eod.getTime();
    };

    var dayOfWeekString = function (theDate) {
        // return day of Week
        var days = ["Sunday", "Monday", "Tuesday", "Wednesday",
            "Thursday", "Friday", "Saturday"];
        var dateObj = new Date(theDate);

        return days[dateObj.getDay()];
    };

    var dateString = function (theDate) {
        var months = ["January", "February", "March", "April",
            "May", "June", "July", "August", "September",
            "October", "November", "December"];

        var dateObj = new Date(theDate);
        return dayOfWeekString(theDate) + ", " +
            months[dateObj.getMonth()] + " " + dateObj.getDate();
    };

    var timeString = function (theDate) {
        var dateObj = new Date(theDate);

        var hours = dateObj.getHours();
        var minutes = dateObj.getMinutes();
        var ampm = hours >= 12 ? 'pm' : 'am';

        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;

        var strTime = hours + ':' + minutes + ' ' + ampm;
        return strTime;
    };

    var dateTimeString = function (theDate) {
        return dateString(theDate) + " " + timeString(theDate);
    };

    // getGameDetails
    // build out relevent game information
    //
    // gameDetails =
    // 		event   : name of the tournament
    // 		eventid : unique identifier for this tournamnent
    // 		start   : tournament start time
    // 		end	    : tournament end time
    //
    //
    this.getGameDetails = function (game, id) {
        var gameDetails = {
            event: game.name,
            eventid: id
        };

        if (game.start) {
            gameDetails.start = Date.parse(game.start);
        }

        if (game.end) {
            gameDetails.end = Date.parse(game.end);
        }

        return gameDetails;
    };

    // at the specified number of hours to the event start time
    // add a grace period of 10 hours, e.g. 10AM EDT of the following day
    this.addGracePeriod = function (gameDetails, hours) {

        if (gameDetails.start) {
            var graceperiod = 1000 * 60 * 60 * hours; // hours in milliseconds
            gameDetails.start += graceperiod;
        }

        return gameDetails;
    };

    this.tournamentComplete = function (start, end) {
        const now = Date.now();

        // set "end" to be the end of the current day before we do a
        // comparison.  this will give us a grace period for the
        // ending of tournament to be at midnight of the final day
        end = endOfDay(end);

        console.debug("tournamentComplete: start " + dateTimeString(start)
            + ", ending " + dateTimeString(end)
            + ", now " + dateTimeString(now));

        return end < now;
    };

    this.tournamentInProgress = function (start, end) {
        var now = Date.now();

        // bump end date to end of the current day before comparing
        end = endOfDay(end);

        console.log("tournamentInProgress: start: " +
            dateTimeString(start) + " end: " + dateTimeString(end) +
            " now: " + dateTimeString(now));

        return (now > start) && (now < end);
    };


};

module.exports = GameUtils;