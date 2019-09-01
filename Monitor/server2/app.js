const express = require('express');
const app = express();
const ping = require('ping');
const http = require('http');
app.use(express.static("public"));
app.set('view engine','ejs');

var bvm = [1, 0], bs = [1, 0];
var hosts = ['1.2.3.100', '1.2.3.200'];
var http_timeout = 1000;
var request_timeout = 1100;
var poll_freq = 1000;

function poll() {
	host = '1.2.3.100';
	console.log(`Polling`);
	ping.promise.probe(host, {
		timeout: 1,
	}).then((stat) => {
		if (stat.alive) {
			var adr=`http://${host}:3000/ping`
			console.log('pinging: ');
			http.get(adr, (r) => {
				var bodyChunks = [];
				r.on('data', function (chunk) {
					console.log('data from: ' + adr);
					bodyChunks.push(chunk);
				}).on('end', function () {
					var body = Buffer.concat(bodyChunks);
					console.log(`[Live] ${adr} is live.`);
				});
			}).on('error', (err) => {
				console.log(`[Error] ${err}`)
			}).setTimeout(http_timeout, () => {
				console.log(`[Timeout] Request to ${adr} timed out.`);
			});
		} else {
			console.log(`[not live] ${host} is not live.`);
		}
	}).catch((err) => {
		console.log(`error: ${err}`);
		return;
	});
}

setInterval(poll, poll_freq);

app.listen(3000);

console.log('app started');
