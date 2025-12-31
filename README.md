# GolfPicks

For this project to run successfully, you will need to configure your AWS credentials in a .env or .env.dev (when running in dev mode) file with the following fields:

``` bash
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
TOURDATA_URL=https://tourdata.boulia-nc.net/api
```

Additionaly,if you are running in dev mode, you will need to add the CORS key pointing to the port the client is running on:

```bash
CORS_CLIENT=http://localhost:4201
```

## Building and Running the App
To build this project for the first time, you will need npm, and angular cli (ng) installed. Once you have those, do this:

### Production
To build the production client side: 
``` bash
cd client
npm install
npm run build
```

This will place the built client side code under client/dist.

To run the server in production mode:
``` bash
cd server
npm install
npm start
```

This will run the NestJS server for the backend, and will serve up the client side from client/dist

### Development mode
To run the server in development mode:

``` bash
cd server
npm run start:dev
```

Note that the `.env` file will be pulled for production, `.env.dev` when running in dev mode.

To run the client in development mode:

``` bash
cd client
npm run start:dev
```

## What the app does

This app allows a group of players to compete against each other by picking the best set of golfers in a given tournament.  

Each player will select 10 golfers.  Of those 10, you can only select 2 of the top 10 golfers in the world. To keep everyone in the game through the tournament, only your top 5 players will count in the scoring. The scoring will be the cumulative score of those 5 players.  The person with the lowest score is the winner.  

## Overall Design

- There is a client side, Angular (https://angularjs.org) based app located under the `/client` directory.  
- The server side is implemented in NestJS and resides in the `/server` directory.
- You can browse the server side API via Swagger at the URL http://localhost:3000/api
- For the most part, the server side API provides access to the game data, which is stored in an Amazon DynamoDB database.  The one exception is PGA tournamnet scoring data, which comes from the tourdata API (https://tourdata.boulia-nc.net/explorer)

## Change History:
December 23, 2025:
- Major overhaul to upgrade to Angular 20 and Tailwind styling based on TailAdmin template
- Migrated backend to NestJS 11
- Migrated to AWS SDK v3

November 17, 2022:
- Major overhaul to upgrade to Angular 14

September 5, 2022:
- Major overhaul to remove loopback dependency 
- Switched backend data sources to Amazon DynamoDB (vs. IBM Cloudant)

Aoril 9, 2019:
- Changes to accommodate Golf Channel site.

March 26, 2019:
- Moved from Bluemix to IBM Cloud labeling
- Moved to Cloudant Lite plan, added retry plugin to accommodate rate limiting

March 25, 2016: 
- Moved to Loopback and responsive RDash Angular UI