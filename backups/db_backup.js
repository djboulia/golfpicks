var Promise = require('promise');

var me = 'xxxxxxxxxxFixMexxxxxxxxxxxx';
var password = 'xxxxxxxxxxFixMexxxxxxxxxxxx';
var dbName = 'golfpicks';

var cloudant = require('cloudant')({
  account: me,
  password: password,
});

var db = cloudant.use(dbName);

var dumpClass = function (className) {
  return new Promise(function (fulfill, reject) {
    db.view(
      'basicmap',
      'class',
      {
        key: className,
      },
      function (err, body) {
        if (!err) {
          var objs = [];
          console.error('listing all entries with className ' + className);
          body.rows.forEach(function (doc) {
            console.error(doc.value);

            objs.push(doc.value);
          });

          fulfill(objs);
        } else {
          console.error(err);
          reject(err);
        }
      },
    );
  });
};

function dumpClasses(classes) {
  var finalOutput = [];
  var iterations = [];

  for (var i = 0; i < classes.length; i++) {
    var p = dumpClass(classes[i]).then(function (output) {
      //            console.log("results are : " + JSON.stringify(output));

      finalOutput = finalOutput.concat(output);
    });

    iterations.push(p);
  }

  return Promise.all(iterations).then(function (output) {
    return finalOutput;
  });
}

var dumpDesign = function () {
  return new Promise(function (fulfill, reject) {
    db.get('_design/basicmap', function (err, data) {
      if (!err) {
        fulfill(data);
      } else {
        console.error(err);
        reject(err);
      }
    });
  });
};

dumpClasses(['Game', 'Event', 'Course', 'Gamer']).then(function (objs) {
  dumpDesign().then(function (design) {
    // combine the class and design data
    objs.push(design);

    // output the combined set
    console.log(JSON.stringify(objs));
  });
});
