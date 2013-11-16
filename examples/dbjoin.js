var $ = require("../mongous").Mongous;

$('test.user').save({id:5, name: 'mark nadal'});
$('test.user').save({id:7, name: 'bob banto'});
$('test.user').save({id:9, name: 'charles carant'});
$('game.tournament').save({title: 'championship', id: 9, where: 'USA'});
$('game.tournament').save({title: 'open', id: 7, where: 'USA'});
$('game.level').save({user:5, time: 99, level: 1, tournament: 7});
$('game.level').save({user:7, time: 95, level: 1, tournament: 9});
$('game.level').save({user:9, time: 96, level: 1, tournament: 9});
$('game.level').save({user:7, time: 93, level: 2, tournament: 7});

var TS = new Date().getTime();
$('game.level').find({level: 1}
, {}
, {join: {
	user: '$test.user.id'
	,tournament: '.tournament.id'
}}
, function(r){
	console.log(r.documents, 'in ' + ((new Date().getTime()) - TS) +'ms');
	
	// remove them.
	$('game.level').remove({},{level: 1});
	$('game.tournament').remove({},{title: 1});
	$('test.user').remove({},{name: 1});
});
