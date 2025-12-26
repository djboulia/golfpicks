export type Game = { name: string; start: string; end: string };

type GameDetails = {
  event: string;
  eventid: string;
  start?: number;
  end?: number;
};

const endOfDay = function (timems: number) {
  // convert timems to end of the current day.
  // this will give us a grace period for comparisons
  const eod = new Date(timems);

  eod.setHours(23, 59, 59, 999);

  return eod.getTime();
};

const dayOfWeekString = function (theDate: number) {
  // return day of Week
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const dateObj = new Date(theDate);

  return days[dateObj.getDay()];
};

const dateString = function (theDate: number) {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dateObj = new Date(theDate);
  return (
    dayOfWeekString(theDate) +
    ', ' +
    months[dateObj.getMonth()] +
    ' ' +
    dateObj.getDate()
  );
};

const timeString = function (theDate: number) {
  const dateObj = new Date(theDate);

  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';

  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesString = minutes < 10 ? '0' + minutes : minutes.toString();

  const strTime = hours + ':' + minutesString + ' ' + ampm;
  return strTime;
};

const dateTimeString = function (theDate: number) {
  return dateString(theDate) + ' ' + timeString(theDate);
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
export const getGameDetails = function (game: Game, id: string) {
  const gameDetails: GameDetails = {
    event: game.name,
    eventid: id,
    start: game.start ? Date.parse(game.start) : undefined,
    end: game.end ? Date.parse(game.end) : undefined,
  };

  return gameDetails;
};

// at the specified number of hours to the event start time
// add a grace period of 10 hours, e.g. 10AM EDT of the following day
export const addGracePeriod = function (
  gameDetails: GameDetails,
  hours: number,
) {
  if (gameDetails.start) {
    const graceperiod = 1000 * 60 * 60 * hours; // hours in milliseconds
    gameDetails.start += graceperiod;
  }

  return gameDetails;
};

export const tournamentComplete = function (
  start: number | undefined,
  end: number | undefined,
) {
  if (start === undefined || end === undefined) {
    console.debug(
      'tournamentComplete: start or end is undefined (start: ' +
        start +
        ', end: ' +
        end +
        ')',
    );
    return false;
  }

  const now = Date.now();

  // set "end" to be the end of the current day before we do a
  // comparison.  this will give us a grace period for the
  // ending of tournament to be at midnight of the final day
  end = endOfDay(end);

  console.debug(
    'tournamentComplete: start ' +
      dateTimeString(start) +
      ', ending ' +
      dateTimeString(end) +
      ', now ' +
      dateTimeString(now),
  );

  return end < now;
};

export const tournamentInProgress = function (
  start: number | undefined,
  end: number | undefined,
) {
  if (start === undefined || end === undefined) {
    console.debug(
      'tournamentComplete: start or end is undefined (start: ' +
        start +
        ', end: ' +
        end +
        ')',
    );
    return false;
  }

  const now = Date.now();

  // bump end date to end of the current day before comparing
  end = endOfDay(end);

  console.log(
    'tournamentInProgress: start: ' +
      dateTimeString(start) +
      ' end: ' +
      dateTimeString(end) +
      ' now: ' +
      dateTimeString(now),
  );

  return now > start && now < end;
};

// [djb 5/20/2019] added timezone possibility for tee times
//
// see if the round score is actually a tee time in the format
// hh:mm [am|pm] or hh:mm [am|pm] [TZ]
export const isValidTeeTime = function (timeStr: string) {
  const timePat = /^(\d{1,2})(:(\d{2}))?(\s?(AM|am|PM|pm))?(\s?([A-Z][A-Z]))?$/;
  const matchArray = timeStr.match(timePat);

  return matchArray != null;
};
