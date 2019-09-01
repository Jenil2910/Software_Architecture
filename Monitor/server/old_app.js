const express = require('express');
const app = express();
const ping = require('ping');
const https = require('http');
app.use(express.static("public"));

var bvm = [0, 0], bs = [0, 0];
var hosts = ['1.2.3.100', '1.2.3.200'];
/*var cfg = {
    timeout: 1,
};*/
var http_timeout = 2000;

function ccb(res, start){
    res.send(`${JSON.stringify({VM: bvm, B: bs})} in ${new Date() - start} miliseconds.`);
}

app.get('/calculate', (req, res)=>{
	console.log(JSON.stringify(req.query));
	var counter=0;
	var start = new Date();
	hosts.forEach((host, idx)=>{
	    ping.promise.probe(host, {
		timeout: 1,
	    }).then((stat)=>{
		if(stat.alive){
		    bvm[idx]=1;
		    var adr = `http://${host}:3000/ping`;
		    console.log('pinging: '+adr);
		    https.get(adr, (r)=>{
			var bodyChunks = [];
                        r.on('error', (err) => {
			    console.log(`Error via pinging ${err}.`);
			    bs[idx]=0;
                            counter++;
                            if(counter==2){
                                ccb(res, start);
                            }
			    return;
			}).on('data', function(chunk) {
			    console.log('data from: '+adr);
			    bodyChunks.push(chunk);
                        }).on('end', function() {
                            var body = Buffer.concat(bodyChunks);
			    console.log(`${adr} is ended.`);
                            if(body.toString()=='pong'){
                                  bs[idx]=1;
                            }else{
                                  bs[idx]=0;
                            }
			    counter++;
			    if(counter==2){
				ccb(res, start);
			    }
			    return;
                        });
                    }).setTimeout(1000, ()=>{
			console.log(`Request to ${adr} timed out.`);
			bs[idx]=0;
			counter++;
			if(counter==2){
			    ccb(res, start);
			}
			return;
		    });
		}else{
			console.log(`${host} is not live.`);
			bvm[idx]=0;
			bs[idx]=0;
			counter++;
			if(counter==2){
                            ccb(res, start);
                        }
		}
	    }).catch((err)=>{
		console.log(`error: ${err}`);
		//res.send(`error: ${err}`);
		counter++;
		if(counter==2){
		    ccb(res, start);
		}
	    });
	});
	/*var promises = hosts.map( (host, idx) => {
	    return new Promise((resolve, reject)=>{
                ping.sys.probe(host, (isAlive, err)=>{
		    if(err){reject(err);}
                    if(isAlive){bvm[idx]=1;resolve(1);}else{bvm[idx]=0;resolve(0);}
                }, cfg);
	    });
	});
	var pings = ['http://1.2.3.100:3000/ping', 'http://1.2.3.200:3000/ping'].map( (adr, idx) => {
            return new Promise((resolve, reject)=>{
		    console.log('pinging: '+adr);
		    https.get(adr, (r)=>{
		        var bodyChunks = [];
		        r.on('data', function(chunk) {
			  console.log('data from: '+adr);
		          bodyChunks.push(chunk);
		        }).on('end', function() {
		          var body = Buffer.concat(bodyChunks);
		          if(body.toString()==='pong'){
				bs[idx]=1;
				resolve(1);
			  }else{
				bs[idx]=0;
				resolve(0);
			  }
		        });
		    });
            });
        });
	Promise.all(promises).then(() => {
		return Promise.all(pings);
	}).then(()=>{
		res.send(JSON.stringify({VM: bvm, B: bs}));
	});*/
});

app.listen(3000);

console.log('app started');
