mongous, for hu*mongous*, is a dead simple and blazing fast MongoDB driver. It is fast because it is a direct interface, cutting out all of node-mongodb-native bloat and only using the connection and binary goodies.

<h1>How it works</h1>

<code>
require mongous.start();
"DatabaseName.CollectionName".[MongoDBCommand](query [, doc, [, options]], function(err, result){
	var bliss = result;
}); // Done!
</code>

That is right folks, rather than having the driver manually handle databases and collections, which leads to unnecessary bloat, you get blissful freedom. This makes it a breeze to implement anywhere in your code, as it works natively with any String!

Ex.
<code>
"blog.post".save({ hello: "world" }, function(err, res){ console.log(res) });
var pagename = url.pathname.substr(0,1).replace('/','.');
pagename.save({ foo: "bar" }, function(err, res){ console.log(res) });
"db.really.deeply.nested.collections".save({ smile: "happy" });
</code>

That's all folks!
**Warning: this module was just created and doesn't work yet**