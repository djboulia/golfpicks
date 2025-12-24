import { Ranking, TourData, TourEvent } from './pgascores/tourdata.js';
import * as NameUtils from './pgascores/nameutils.js';
import { UpdateEventDto } from 'src/events/dto/update-event.dto.js';

const hasNickname = function (name: string | undefined, nicknames: string[]) {
  if (!name) return false;

  for (let i = 0; i < nicknames.length; i++) {
    if (nicknames[i] == name) {
      return true;
    }
  }

  return false;
};

//
// pick up common abbreviations for first names
// e.g. Alex is an abbreviation of Alexander
//
const sameFirstName = function (
  firstName1: string | undefined,
  firstName2: string | undefined,
) {
  const names = {
    alexander: ['alex'],
    soren: ['søren'],
    william: ['bill', 'billy', 'will', 'willy'],
  };

  // do the simple check first
  if (firstName1 == firstName2) {
    return true;
  }

  for (const key in names) {
    const nicknames: string[] = names[key] as string[];

    if (key == firstName1) {
      if (hasNickname(firstName2, nicknames)) return true;
    } else if (key == firstName2) {
      if (hasNickname(firstName1, nicknames)) return true;
    }
  }

  return false;
};

// attempts to match name1 and name2
// returns:
// -1 : no matching components
//  0 : perfect match
//  1 : last name match
//  2 : last name and first letter of first name match
//  3 : last name and first name match
//
// to improve matching chances, we normalize case and remove punctuation
const fuzzyMatch = function (name1: string, name2: string) {
  name1 = name1.toLowerCase().replace(/[,.']/g, ''); // remove any punctuation
  name2 = name2.toLowerCase().replace(/[,.']/g, ''); // remove any punctuation

  // convert whitespace into matchable space characters
  name1 = name1.replace(/\s/g, ' ');
  name2 = name2.replace(/\s/g, ' ');

  // try the easiest thing first
  if (name1 == name2) {
    //		console.log( "found match at name1:'" + name1 + "' name2:'" + name2 + "'");
    return 0;
  }

  const words1 = name1.split(/\s/g);
  //	console.log( JSON.stringify( "words 1:" + words1 ) );
  const words2 = name2.split(/\s/g);
  //	console.log( JSON.stringify( "words 2:" + words2 ) );

  let result = 0;

  // compare last names first
  let word1 = words1.pop();
  let word2 = words2.pop();

  if (word1 == word2) {
    result++;

    // see if the last name was a modifier like jr, i, ii, iii
    if (word1 == 'jr' || word1 == 'i' || word1 == 'ii' || word1 == 'iii') {
      // then compare next to last word
      if (words1.length > 0 && words2.length > 0) {
        word1 = words1.pop();
        word2 = words2.pop();
        if (word1 == word2) {
          result++;
        }
      }
    }

    // now look at first name
    if (words1.length > 0 && words2.length > 0) {
      word1 = words1.shift();
      word2 = words2.shift();
      if (sameFirstName(word1, word2)) {
        result++;

        // finally look at remainder
        while (words1.length > 0 && words2.length > 0) {
          word1 = words1.pop();
          word2 = words2.pop();
          if (word1 == word2) {
            result++;
          } else {
            break;
          }
        }
      }
    }
  }

  if (result > 0) {
    const matchTypes = [
      'exact',
      'last name',
      'last name/first name initial',
      'last name and first name',
    ];
    console.log(
      "found fuzzy match at name1:'" +
        name1 +
        "' name2:'" +
        name2 +
        "' - matched: " +
        matchTypes[result],
    );
  }

  return result > 0 ? result : -1;
};

const findByName = function (rankings: Ranking[], name: string) {
  //		console.log("findByName firing callback...");

  // use a fuzzy search to match up names so we can normalize
  // Freddie vs. Fredrik, etc.
  // returns exactly a result or null if no match

  let lastMatch = -1;
  let lastMatchIndex = -1;

  if (rankings.length == 0) console.log("Golfer rankings didn't load!");

  let result: Ranking | null = null;
  for (let i = 0; i < rankings.length; i++) {
    let match = fuzzyMatch(name, rankings[i].name);
    if (match == 0) {
      lastMatch = 0;
      lastMatchIndex = i;
      //				console.log("Found an exact match!");
      break; // return on a perfect match
    } else {
      // remember the last match, see if this is better
      if (match == 1) {
        // last name was the only match... this isn't good enough to keep
        match = -1;
      }

      if (match > lastMatch) {
        lastMatchIndex = i;
      } else if (match >= 0 && match == lastMatch) {
        //					console.log("Found an equal match!");
      }
    }
  }

  // if we get all the way through with no perfect match,
  // return the best "fuzzy" match
  if (lastMatchIndex >= 0) {
    result = rankings[lastMatchIndex];
  }

  return result;
};

const addPlayerRankings = function (eventdata: TourEvent, rankings: Ranking[]) {
  // add the ranking data to the event information
  const len = eventdata.scores.length;

  for (let i = 0; i < len; i++) {
    const name = eventdata.scores[i].name;
    const score = eventdata.scores[i];
    const data = findByName(rankings, name);

    // add player rank and unique id to our event data
    if (data != null) {
      score.rank = data.rank;
      score.player_id = data.player_id;
    } else {
      console.log("Couldn't find player " + name);
      score.rank = '-';
      score.player_id = NameUtils.normalize(name);
    }
  }
};

export const getLiveScores = async function (event: UpdateEventDto) {
  const theDate = new Date(event.start);
  const provider = event.provider;

  let year = theDate.getFullYear();

  //
  // [06/11/2019] djb - moved all tournament and ranking data to a
  //                    separate service.  source is here:
  //                    https://github.com/djboulia/tourdata
  //                    simplifies this code such that we only support
  //                    one data provider
  //
  if (provider !== 'tourdata') {
    const str = 'ERROR: unsupported data provider ' + provider;
    console.log(str);
    throw new Error(str);
  }

  // [09/16/2020] djb - started adding the specific tour season year
  //                    since due to COVID seasons don't map directly
  //                    to the calendar year.
  const season = parseInt(event.season);
  if (!isNaN(season)) {
    console.log('found season in event record, setting year to ' + season);
    year = season;
  }

  const tournament_id = event.tournament_id;
  const tourData = new TourData(year);
  const rankings = await tourData.getRankings().catch((e) => {
    console.log('Error retrieving ranking data!');
    throw e;
  });

  const tournament = await tourData.getEvent(tournament_id).catch((e) => {
    console.log('Error retrieving event data!');

    throw e;
  });

  addPlayerRankings(tournament, rankings);

  return tournament;
};

export const formatNetScore = function (score: number) {
  // pretty print the score with zero represented as "even"
  // and above par scores with a leading + sign
  if (score == 0) return 'E';

  if (score > 0) return '+' + score;

  return String(score);
};

export const parseNetScore = function (score: string | undefined) {
  // parse a score in net format, e.g. -3, E, +1
  // returns NaN if the score isn't valid
  if (score === undefined) return NaN;

  // look for special case of "even" par as "E"
  if (score.toUpperCase() == 'E') {
    return 0;
  }

  return parseInt(score);
};

export const isValidNetScore = function (score: string) {
  return !isNaN(parseNetScore(score));
};

export const isNumber = function (str: string | undefined) {
  if (str === undefined) return false;

  const result = parseInt(str);
  return !isNaN(result);
};

export const isValidScore = function (score: number | string) {
  // if it has anything but digits, that's bad
  if (String(score).search(/^\s*\d+\s*$/) != -1) {
    return true;
  }

  return false;
};
