console.log("loading GolfPicks.gameUtils");

angular.module('GolfPicks.gameUtils', [])
    .factory('gameUtils', [function () {
        var config = {
            debug: false
        };

        var logger = {
            log: function (str) {
                console.log(str);
            },
            debug: function (str) {
                if (config.debug) console.debug(str);
            },
            error: function (str) {
                console.error(str);
            }
        };

        var endOfDay = function (timems) {
            // convert timems to end of the current day.
            // this will give us a grace period for comparisons
            var eod = new Date(timems);

            eod.setHours(23, 59, 59, 999);
            
            return eod.getTime();
        };

        return {
            logger: logger,

            setDebug: function (val) {
                config.debug = val;
            },

            dayOfWeekString: function (theDate) {
                // return day of Week
                var days = ["Sunday", "Monday", "Tuesday", "Wednesday",
                            "Thursday", "Friday", "Saturday"];
                var dateObj = new Date(theDate);

                return days[dateObj.getDay()];
            },

            dateString: function (theDate) {
                var months = ["January", "February", "March", "April",
                              "May", "June", "July", "August", "September",
                              "October", "November", "December"];

                var dateObj = new Date(theDate);
                return this.dayOfWeekString(theDate) + ", " +
                    months[dateObj.getMonth()] + " " + dateObj.getDate();
            },

            timeString: function (theDate) {
                var dateObj = new Date(theDate);

                var hours = dateObj.getHours();
                var minutes = dateObj.getMinutes();
                var ampm = hours >= 12 ? 'pm' : 'am';

                hours = hours % 12;
                hours = hours ? hours : 12; // the hour '0' should be '12'
                minutes = minutes < 10 ? '0' + minutes : minutes;

                var strTime = hours + ':' + minutes + ' ' + ampm;
                return strTime;
            },

            dateTimeString: function (theDate) {
                return this.dateString(theDate) + " " + this.timeString(theDate);
            },

            tournamentComplete: function (start, end) {
                // set "end" to be the end of the current day before we do a
                // comparison.  this will give us a grace period for the
                // ending of tournament to be at midnight of the final day
                end = endOfDay(end);

                logger.debug("tournamentComplete: start " + start + ", ending " + end);

                return end < Date.now();
            },

            tournamentInProgress: function (start, end) {
                var now = Date.now();

                // bump end date to end of the current day before comparing
                end = endOfDay(end);

                console.log("tournamentInProgress: start: " +
                    this.dateTimeString(start) + " end: " + this.dateTimeString(end) +
                    " now: " + this.dateTimeString(now));

                return (now > start) && (now < end);
            },

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
            getGameDetails: function (game) {
                var gameDetails = {
                    event: game.name,
                    eventid: game._id
                };

                if (game.start) {
                    gameDetails.start = Date.parse(game.start);
                }

                if (game.end) {
                    gameDetails.end = Date.parse(game.end);
                }

                return gameDetails;
            },

            // at the specified number of hours to the event start time
            // add a grace period of 10 hours, e.g. 10AM EDT of the following day
            addGracePeriod: function (gameDetails, hours) {

                if (gameDetails.start) {
                    var graceperiod = 1000 * 60 * 60 * hours; // hours in milliseconds
                    gameDetails.start += graceperiod;
                }

                return gameDetails;
            }
        }
    }]);
