var con = require('./connection')
	,MongoReply = require('./responses/mongo_reply').MongoReply;

function start(database, host, port, serverConfig, options) {
	var db;
	this.database = database;
	this.host = host || '127.0.0.1';
	this.port = port || 27017;
	this.serverConfig = serverConfig || {};
	this.options = options || {};
	this.connected = false;
	this.connections = [];
	var server = new con.Server(this.host, this.port, this.serverConfig);
	console.log(con.Connection.boot);
	
	if (server instanceof con.Server) {
		server.con = new con.Connection(this.host, this.port, server.autoReconnect);
		this.connections.push = [server.con];
		
		server.connections.addListener("connect", function(){
			this.connected = true;
		});
		/*
		server.connection.addListener("data", function(message) {
			// Parse the data as a reply object
			var reply = new MongoReply(message);
			// Emit message
			self.emit(reply.responseTo.toString(), null, reply);
			// Remove the listener
			self.removeListener(reply.responseTo.toString(), self.listeners(reply.responseTo.toString())[0]);
		 });*/
	}
}

String.prototype.update = function(query, doc, upsert, multi){
	var self = this;
	if (!query || !doc) 
		return "Error: Query and document required.";
	if(error(self)) return error(self);
		
	upsert = upsert ? 1 : 0;
	multi = multi ? 1 : 0;
	
	console.log("here I am !");
	return self + ", " + upsert + ", " + multi;
};

String.prototype.save = function(query, doc, fn){
	return this.update(query, doc, true);
};

function error(self){
	if (self.length >= 80) 
		return 		"Error: Database name + collection name exceeds 80 character limit.";
	var p = self.search(/\./);
	if (p <= 0)
		return 		"Error: Database.collection nomenclature required.";
	var db = self.slice(0,p)
		,col = self.substr(p+1).toString();
	if (col.search(/\$/) >= 0) {
		if (col.search(/\$cmd/i) < 0)
			return 	"Error: Cannot use '$' unless for commands.";
		else return "Error: silent.";
	} else if (col.search(/^[a-z|\_]/i) < 0)
		return 		"Error: Collection must start with a letter or an underscore.";
	return false;
}

exports.start = start;