var $ = require("../mongous").Mongous;

(function(){ // generate data
	return;
	
	for (var i = 0; i < 105; i++){
		$('test.user').save({_id: i, name: Math.random().toString(36).substr(2, 20) });
	}

	/*for (var i = 0; i < 500; i++){
		$('game.tournament').save({_id: i, where: Math.random().toString(36).substr(2, 5), title: Math.random().toString(36).substr(2, 20) });
	}*/

	for (var i = 0; i < 105; i++){ // merging on 0 cause problems?
		$('game.level').save({
		  user: i
		, time: Math.floor(Math.random() * (99 - 60 + 1)) + 60
		, level: 1
		});
	}
})();

console.log('done!');
var TS = new Date().getTime();
$('game.level').find({level: 1}
, {}
, {join: {
	user: '$test.user._id'
	,tournament: '.tournament._id'
}}
, function(r){
	r && r.documents && console.log(r.documents[0]);
	r && r.documents && console.log(r.documents[r.documents.length-1]);
	r && r.documents && console.log(r.documents.length, 'in', ((new Date().getTime()) - TS), 'ms');
	
	// remove them. 
	/*$('game.level').remove({},{level: 1});
	$('game.tournament').remove({},{title: 1});
	$('test.user').remove({},{name: 1});*/
});
