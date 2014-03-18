DL twitter trigger
=======================

A demonstration of using Node.js with Twitter's streaming capability to trigger and evoke a DL command event (general webpage updated via Socket.io!

Credits
=======================

I shamelessly lifted code and foundation from Dillon Buchanan: http://www.dillonbuchanan.com/programming/node-js-twitter-streaming-api-socket-io-twitter-cashtag-heatmap/
I forked the original code from : https://github.com/thedillonb/twitter-cashtag-heatmap

Modification for DL have been appended by myself Troy Meuninck


Running Locally
=======================

Running this application locally requires that you input four twitter API keys. I cannot provide you with these
keys since only one streaming connection can be made for each. However, you can go to https://apps.twitter.com/, 
create a new application, and use the API keys from that in this application. Don't worry, it's free ;)

Once you have the API keys you'll just need to insert them into the app.js file. The placeholders should be
easy to find as they're at the top of the file with a big IMPORTANT stamp on them.


