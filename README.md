# GolfPicks

To build this project for the first time, you will need npm, node bower and gulp installed.  Once you have those, do this:

```
sudo npm install

bower install

gulp
```

For this project to run successfully, you will need to configure your cloudant database
name and credentials in the file:


server/datasources.json

## What the app does

This app allows a group of players to compete against each other by picking the best set of golfers in a given tournament.  

Each player will select 10 golfers.  Of those 10, you can only select 2 of the top 10 golfers in the world. To keep everyone in the game through the tournament, only your top 5 players will count in the scoring. The scoring will be the cumulative score of those 5 players.  The person with the lowest score is the winner.  

## Overall Design

- There is a client side, Angular (https://angularjs.org) based app located under the /client directory.  /client/src/index.html is the main entry point
- There is also a mobile optimized site under /client/src/mobile which uses the Ionic framework (http://ionicframework.com).
- The server side is implemented in Node and uses StrongLoop (https://strongloop.com). It is located in the /server directory.  /server/server.js is the main entry point for the backend server.
- You can browse the server side API at the URL http://localhost:3000/explorer
- For the most part, the server side API provides access to the game data, which is stored in a Cloudant database.  The one exception is scoring data, which comes from the various live scoring sites.
- Live scoring data is implemented in /common/lib/scores.js.  There are two aspects to the scoring data:
  1. The world rankings.  Given the game rules, world rankings control how golfers are chosen by the players of the game.
  2. The tournament scores.  The scores for each round of the tournament are then used to determine who wins the game.



## Change History:

September 5, 2022:
Major overhaul to remove loopback dependency 
Switched backend data sources to Amazon DynamoDB (vs. IBM Cloudant)

Aoril 9, 2019:
Changes to accommodate Golf Channel site.

March 26, 2019:
Moved from Bluemix to IBM Cloud labeling
Moved to Cloudant Lite plan, added retry plugin to accommodate rate limiting

March 25, 2016: 
Moved to Loopback and responsive RDash Angular UI
