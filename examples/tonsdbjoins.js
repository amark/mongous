var $ = require("../mongous").Mongous;

(function(){ // generate data. Do this separately (comment out the return)
	return;
	for (var i = 0; i <= 5000; i++){
		$('test.user').save({_id: i, name: Math.random().toString(36).substr(2, 20) });
	}

	for (var i = 0; i <= 500; i++){
		$('game.tournament').save({_id: i, where: Math.random().toString(36).substr(2, 5), title: Math.random().toString(36).substr(2, 20) });
	}
	
	for (var i = 0, u = 0, t = 0; i <= 10000; i++){ // Let's try this with more deterministic numbers.
		$('game.level').save({
		  _id: i
		, user: u
		, time: Math.floor(Math.random() * (99 - 60 + 1)) + 60
		, level: 1
		, tournament: t
		});
		t = t === 500? 0 : t + 1;
		u = u === 5000? 0 : u + 1;
	}
	console.log('non-async done!');
})();

(function(){
	var TS = new Date().getTime();
	$('game.level').find({level: 1}
	, {}
	, {join: {
		user: '$test.user._id'
		,tournament: '.tournament._id'
	}}
	, function(r){
		r && r.documents && console.log(r.documents[r.documents.length-1]);
		console.log('in ' + ((new Date().getTime()) - TS) +'ms');
		
		// remove them. 
		/*
		$('game.level').remove({},{level: 1});
		$('game.tournament').remove({},{title: 1});
		$('test.user').remove({},{name: 1});*/
	});
})();