const express = require('express');
const app = express();

function rangeRandom(a, b){
	return Math.floor(Math.random()*(b-a+1) + a);
}

app.get('/', (req, res)=>{ 
	if(typeof req.query.first !== 'undefined' && typeof req.query.second !== 'undefined'){
		var obj = {
			sum: Number(req.query.first) + Number(req.query.second),
			random: rangeRandom(70, 100),
			err: false
		};
		res.send(JSON.stringify(obj));
	}
	res.send(JSON.stringify({err: true}));
});

app.get('/ping', (req, res)=>{
	res.send('pong');
});

app.listen(3000);
