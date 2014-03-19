/**
 * Module dependencies.
 */
var express = require('express')
  , io = require('socket.io')
  , http = require('http')
  , twitter = require('ntwitter')
  , cronJob = require('cron').CronJob
  , _ = require('underscore')
  , path = require('path');

//Create an express app
var app = express();

//Create the HTTP server with the express app as an argument
var server = http.createServer(app);

// IMPORTANT!!
//You will need to get your own key. Don't worry, it's free. But I cannot provide you one
//since it will instantiate a connection on my behalf and will drop all other streaming connections.
//Check out: https://dev.twitter.com/ You should be able to create an application and grab the following
//crednetials from the API Keys section of that application.
var api_key = '1aExe8VjCWYfMqIJGW9w';               // <---- Fill me in
var api_secret = 'Kbw13Wdd1rNwDva99J5B4i3XBlraZ8ezJfw8kt7yPk';            // <---- Fill me in
var access_token = '2394810498-UEUWHrb1PgldqQ2Ju7kDrtjd5hz0nPvUGlE5SRd';          // <---- Fill me in
var access_token_secret = 'GrPBQqM9lhcXuvvvV7Y4cQYpukzpftTDXxO0qMoEbHcTr';   // <---- Fill me in

// Twitter symbols array.
var watchSymbols = ['lights on', 'light on', 'lights off', 'light off', 'door lock', 'lock door', 'door unlock', 'unlock door', 'DL_LIGHTS_ON', 'DL_LIGHTS_OFF', 'DL_OPEN_DOOR', 'DL_CLOSE_DOOR'];

//This structure will keep the total number of tweets received and a map of all the symbols and how many tweets received of that symbol
var watchList = {
    total: 0,
    symbols: {}
};

//Set the watch symbols to zero.
_.each(watchSymbols, function(v) { watchList.symbols[v] = 0; });

//Generic Express setup
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

//We're using bower components so add it to the path to make things easier
app.use('/components', express.static(path.join(__dirname, 'components')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//Our only route! Render it with the current watchList
app.get('/', function(req, res) {
	res.render('index', { data: watchList });
});

//Start a Socket.IO listen
var sockets = io.listen(server);

//Set the sockets.io configuration.
//THIS IS NECESSARY ONLY FOR HEROKU!
sockets.configure(function() {
  sockets.set('transports', ['xhr-polling']);
  sockets.set('polling duration', 10);
});

//If the client just connected, give them fresh data!
sockets.sockets.on('connection', function(socket) { 
    socket.emit('data', watchList);
});

//*************************create the HTTP POST Method for mike's DL control service

/*mikes stuff


http://prodmos.foundry.att.com/dlife/dl/svcs/devices/doghousesyst/dogh_light_on

http://prodmos.foundry.att.com/dlife/dl/svcs/devices/doghousesyst/dogh_light_off

*/

function CallDLService(command) {
	console.log("here i am");
					var options = 
					{
						hostname: 'prodmos.foundry.att.com', //'www.google.com', //, //,
						port: 80,
						//path: '/dlife/dl/svcs/devices/doghousesyst/dogh_light_on',
						path: '/dlife/dl/svcs/devices/doghousesyst/' + command,
						method: 'GET'
					};
    				var response_hold = '';
    				var json_objects = '';
    				var req2 = http.request(options, function(res2)
    				{
        				console.log('STATUS: ' + res2.statusCode);
        				console.log('HEADERS: ' + JSON.stringify(res2.headers));
        				res2.setEncoding('utf8');
        				res2.on('data', function (chunk) 
        				{
            				response_hold = response_hold + chunk;
            				console.log('BODY: ' + chunk);
        				});
        				res2.on('end', function ()
        				{
            				response_hold = JSON.parse(response_hold);
            				//var json_obj = jquery().parseJSON(response_hold);
            				//testing calling out JSON items by name
            				/*
            				for(var item in response_hold)
            				{
                				console.log(item + ": " + response_hold[item]);
            				};
            				*/
            				console.log('call completed');
            				//res1.writeHead(200, {'Content-Type': 'text/html'});
            				//res1.write(response_hold);
            				//res1.end('function 2 - callback complete \n');
        				});
    				});
    				req2.on('error', function(e) 
    				{
        				console.log('problem with request: ' + e.message);
    				});
    				//write data to request body
    				req2.write('data\n');
    				req2.write('data\n');
    				req2.end();
}

//*****************************END DL GET method


// Instantiate the twitter connection
var t = new twitter({
    consumer_key: api_key,
    consumer_secret: api_secret,
    access_token_key: access_token,
    access_token_secret: access_token_secret
});

// //Tell the twitter API to filter on the watchSymbols 
t.stream('statuses/filter', { track: watchSymbols }, function(stream) {

  //We have a connection. Now watch the 'data' event for incomming tweets.
  stream.on('data', function(tweet) {

    //This variable is used to indicate whether a symbol was actually mentioned.
    //Since twitter doesnt why the tweet was forwarded we have to search through the text
    //and determine which symbol it was ment for. Sometimes we can't tell, in which case we don't
    //want to increment the total counter...
    var claimed = false;

    //Make sure it was a valid tweet
    if (tweet.text !== undefined) {

      //We're gunna do some indexOf comparisons and we want it to be case agnostic.
      var text = tweet.text.toLowerCase();
      //console.log('here is the tweet found: ' + tweet.text.toLowerCase());
      //Go through every symbol and see if it was mentioned. If so, increment its counter and
      //set the 'claimed' variable to true to indicate something was mentioned so we can increment
      //the 'total' counter!
//lets make sure it is a tweet directed @troymeuninck
if (text.indexOf('@troymeuninck') !== -1){
      _.each(watchSymbols, function(v) {
          if (text.indexOf(v.toLowerCase()) !== -1) {
			console.log('WE FOUND ONE');
			console.log(v);
			switch(v.toLowerCase())
			{
				case 'lights on':
				case 'light on':
				case 'dl_light_on':
					console.log('DL_LIGHT_ON just spotted...call mike!');
					CallDLService('dogh_light_on');
					break;
				case 'lights off':
				case 'light off':
				case 'dl_lights_off':
					console.log('DL_LIGHT_OFF just spotted...call mike!');
					CallDLService('dogh_light_off');
					break;
				case 'unlock door':
				case 'door unlock':
					console.log('unlock door just spotted...call mike!');
					CallDLService('dogh_door_unlock');
					break;
				case 'lock door':
				case 'door lock':
					console.log('lock door just spotted...call mike!');
					CallDLService('dogh_door_lock');
					break;
				default:
					console.log ('we spotted something we should not have');
			}
              watchList.symbols[v]++;
              claimed = true;
          }
      });
}
      //If something was mentioned, increment the total counter and send the update to all the clients
      if (claimed) {
          //Increment total
          watchList.total++;

          //Send to all the clients
          sockets.sockets.emit('data', watchList);
      }
    }
  });
});

//Reset everything on a new day!
//We don't want to keep data around from the previous day so reset everything.
new cronJob('0 0 0 * * *', function(){
    //Reset the total
    watchList.total = 0;

    //Clear out everything in the map
    _.each(watchSymbols, function(v) { watchList.symbols[v] = 0; });

    //Send the update to the clients
    sockets.sockets.emit('data', watchList);
}, null, true);


//Create the server
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
