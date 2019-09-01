const express = require('express');
const app = express();
const ping = require('ping');
const http = require('http');
const io = require('socket.io');
app.use(express.static("public"));
app.set('view engine','ejs');

var server = http.createServer(app);
var listener = io.listen(server);

var bvm = [0, 0], bs = [0, 0];
var hosts = ['1.2.3.100', '1.2.3.200'];
var http_timeout = 1100;
var request_timeout = 1100;
var poll_freq = 900;

function poll() {
	console.log(`Polling`);
	hosts.forEach((host, idx) => {
		ping.promise.probe(host, {
			timeout: 1,
		}).then((stat) => {
			if (stat.alive) {
				bvm[idx] = 1;
				var adr = `http://${host}:3000/ping`;
				console.log('pinging: ' + adr);
				http.get(adr, (r) => {
					var bodyChunks = [];
					r.on('data', function (chunk) {
						bodyChunks.push(chunk);
					}).on('end', function () {
						var body = Buffer.concat(bodyChunks);
						console.log(`[Final data] ${body.toString()} recieved from ${adr}`);
						if (body.toString() == 'pong') {
							bs[idx] = 1;
						} else {
							bs[idx] = 0;
						}
						return;
					});
				}).on('error', (err) => {
					console.log(`[ERRGET] Error during get ${err}.`);
					bs[idx] = 0;
				}).setTimeout(http_timeout, () => {
					console.log(`[TIMEOUT] Request to ${adr} timed out.`);
					bs[idx] = 0;
					return;
				});
			} else {
				console.log(`[NOTLIVE] ${host} is not live.`);
				bvm[idx] = 0;
				bs[idx] = 0;
				return;
			}
		}).catch((err) => {
			console.log(`[ERRPING] error: ${err}`);
			return;
		});
	});
}

function custom_get(adr, next, end){
	// console.log(`custom_get called for ${adr}`);
	http.get(adr, (r)=>{
		var bodyChunks = [];
		r.on('data', function (chunk) {
			bodyChunks.push(chunk);
		}).on('end', function () {
			var body = Buffer.concat(bodyChunks);
			var obj = JSON.parse(body);
			console.log(`Request from ${adr} ended.`);
			if(obj.err){
				console.log(`[NCALC] Response ${JSON.stringify(obj)} contains error true.`);
				next();
			}else{
				console.log(`[CALCULATED] Response ${JSON.stringify(obj)} recieved`);
				end(obj);
			}
		}).on('error', (err) => {
			console.log(`[ERRREQ] Error via requesting ${err}.`);
		}).setTimeout(request_timeout, () => {
			console.log(`[TIMEOUT] http to ${adr} timed out.`);
			next();
		});
	});
}

function calculate(a, b){
	return new Promise((resolve, reject) => {
		if(bs[0]){
			console.log(`[LOG] ${hosts[0]} apparently running.`)
			custom_get(`http://${hosts[0]}:3000?first=${a}&second=${b}`,
				() => {custom_get(`http://${hosts[1]}:3000?first=${a}&second=${b}`, () => {reject({err: true, msg: `Both Host failed to calculate`})}, resolve)},
					resolve);
				}else if(bs[1]){
					console.log(`[LOG] ${hosts[1]} apparently running.`)
					custom_get(`http://${hosts[1]}:3000?first=${a}&second=${b}`,
						() => {reject({err: true, msg: `Second Host failed to calculate`})},
						resolve);
				}else{
					reject({err: true, msg: `No host active`});
				}
		});
}

app.get('/', (req, res) => {
	console.log(`[LOG] Recieved JSON.stringify(req.query)`);
	console.log(`[LOG] Current state${JSON.stringify({VM: bvm, B: bs})}`);
	var common = {VM: bvm, B: bs};
	if((typeof req.query.first === 'undefined') || (typeof req.query.second === 'undefined')){
		res.render('index', {common: common});
	}else{
		calculate(req.query.first, req.query.second).then((obj)=>{
			if(obj.err){
				console.log(`[ERRCALC] Error while calculating. Msg: `, obj.msg);
				res.render('index', {common: common});
			}else{
				console.log(`[SUCCESS] Calculate Success.`);
				res.render('index', {common: common, answer: {sum: obj.sum, random: obj.random}});
			}
		}).catch((err)=>{
			console.log(`[ERRCALC] Error while calculating. Msg: `, err);
			res.render('index', {common: common});
		});
	}
});

listener.on('connection', (socket)=>{
	console.log(`[CONNEST] Connection Estanblished`);
	setInterval(()=>{socket.emit('status', `${JSON.stringify({"VM": bvm, "B": bs})}`);}, poll_freq);
	socket.on('disconnect', ()=>{
		console.log('[CONNDIS] Connection Disconnected');
	});
});

setInterval(poll, poll_freq);
app.listen(3000);
console.log('app started');

server.listen(2525);
