Mongous
==========
Mongous, for hu*mongous*, is a simple and blazing fast MongoDB driver that uses a jQuery like syntax.

### How it works

	var $ = require("mongous").Mongous;

	$("database.collection").save({my:"value"});

	$("database.collection").find({},function(r){
		console.log(r);
	});

Done. App development has never felt as close to the shell as this! Making it a breeze to grab'n'store anything anywhere in your code without the nasty hassle of connections, collections, and cascading callbacks.

### Database & Collections

- <code>db('Database.Collection')</code>
	- Database is the name of your database
	- Collection is the name of your collection
	- Examples
		- <code>db('blog.post')</code>
		- <code>db('blog.post.body')</code>

### Commands

- **Update** <code>db('blog.post').update(find, update, ...)</code>
	- find
		is the object you want to find.
	- update
		is what you want to update find with.
	- ...
		- <code>{ upsert: true, multi: false }</code>
		- <code> true, true </code>
- **Save** <code>db('blog.post').save(what)</code>
	- what
		is the object to be updated or created.
- **Insert** <code>db('blog.post').insert(what...)</code>
	- what
		is an object to be created.
		is an array of objects to be created.
	- Examples
		- <code>db('blog.post').save({hello: 'world'})</code>
		- <code>db('blog.post').save([{hello: 'world'}, {foo: 'bar'}])</code>
		- <code>db('blog.post').save({hello: 'world'}, {foo: 'bar'})</code>
- **Remove** <code>db('blog.post').remove(what, ...)</code>
	- what is the object to be removed.
	- ...
		true for atomic.
- **Find** <code>db('blog.users').find(..., function(reply){ })</code>
	- reply
		is the reply from MongoDB.
	- reply.documents
		are the documents that you found from MongoDB.
	- ... <br/>
		params are filtered by type
		- Objects
			- first object
				is what you want to find.
			- second object
				are fields you want
				<br/>Ex: <code>{ name: 1, age: 1 }</code>
			- third object
				is any of the following options:
				<br/> <code>{ lim: x, skip: y }</code>
		- Numbers
			- first number
				is the limit (return all if not specified)
			- second number
				is the skip
	- Examples
		- <code>db('blog.users').find(5, function(reply){ })</code><br/>
			reply.documents is the first 5 documents,
		- <code>db('blog.users').find(5, {age: 23}, function(reply){ })</code><br/>
			with age of 23,
		- <code>db('blog.users').find({age: 27}, 5, {name: 1}, function(reply){ })</code><br/>
			and a name.
		- <code>db('blog.users').find(5, {age: 27}, {name: 1}, {lim: 10}, function(reply){ })</code><br/>
			is the same as the previous example, except the limit is 10 instead of 5.
		- <code>db('blog.users').find(5, function(reply){ }, 2)</code><br/>
			reply.documents skips the first 2 documents and is the next 3 documents.
		- <code>db('blog.users').find(function(reply){ }, {age: 25}, {}, {limit: 5, skip: 2})</code><br/>
			is the same as the previous example except only of doucments with the age of 25.
- **Operations** <code>db('blog.$cmd').find(command,1)</code>
	- command
		is the database operation command you want to perform.
	- Example
		<code>db('blog.$cmd').find({drop:"users"},1)</code><br/>
		drops the users collection, deleting it.
- **Authentication** <code>db('blog.$cmd').auth(username,password,callback)</code>
	- username, password <br/>
		username and password of the 'blog' database
	- callback <br/>
		the callback function when authentication is finished.
	- Example
		- <code>db('blog.$cmd').auth('user','pass',function(reply){})</code><br/>
- **Open** <code>db().open(host,port)</code>
	- Only necessary to call if you explicitly want a different host and port, elsewise it lazy opens.
			
Mongous is a reduction ('less is more') of node-mongodb-driver by Christian Kvalheim.