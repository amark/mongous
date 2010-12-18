Mongous, for hu*mongous*, is a dead simple and blazing fast MongoDB driver that uses jQuery like syntax.

<h1>How it works</h1>

	 db('hello.world').save({foo: 'bar'});

Done. App development has never felt as close to the shell as this! Making it a breeze to grab'n'store anything anywhere in your code without the nasty hassle of connections, collections, and cascading callbacks.

Ex.
    db('hello.world').find( function(data){
		console.log data.documents
	 });

Mongous is a reduction ('less is more') of node-mongodb-driver by Christian Kvalheim.