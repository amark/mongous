Mongous, for hu*mongous*, is a dead simple and blazing fast MongoDB driver that uses jQuery like syntax.

<h1>How it works</h1>

	 db('database.collection').[mongoDBcommand](query [, doc, [, options]], function(err, result){
		var bliss = result;
    }); // Done!

That is right folks, rather than having the driver manually handle databases and collections, which leads to unnecessary bloat, you get blissful freedom. 
This makes it a breeze to implement anywhere in your code without the pain of sitting up complicated connection and collection callbacks.

Ex.
    db('blog.posts').save({ hello: "world" }, function(err, res){ console.log(res) });
    var pagename = url.pathname.substr(0,1).replace('/','.');
    db(pagename).save({ foo: "bar" }, function(err, res){ console.log(res) });
    db('deeply.nested.namespaces').save({ smile: "happy" });

That's all folks!

**Warning: this module only connects to MongoDB as of now**