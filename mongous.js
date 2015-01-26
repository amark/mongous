var Long, bp, com, con, db, ee, mongous, mr, net;
var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
  for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
  function ctor() { this.constructor = child; }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor;
  child.__super__ = parent.prototype;
  return child;
}, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __slice = Array.prototype.slice;
net = require('net');
bp = require('./bson/binary_parser').BinaryParser;
bu = require('./bson/binary_utils'),
ee = require('events').EventEmitter;
com = require('./commands').Commands;
mr = require('./responses/mongo_reply').MongoReply;
reply = require('./reply');
Long = require('./goog/math/long').Long;
MD5 = require('./crypto/md5').MD5;
ObjectID = require('./bson/objectid').ObjectID;

var log = function(s){
	process.stderr.write(s + '\n');
};
con = function() {
  function con() {
    con.__super__.constructor.apply(this, arguments);
  }
  __extends(con, ee);
  con.c = null;
  con.r = null;
  con.s = false;
  con.d = true;
  con.msg = [];
  con.reply = {};
  con.ms = 0;
  con.byt = 0;
  con.b = '';
  con.bb = '';
  con.port = 27017;
  con.host = '127.0.0.1';
  con.recon = true;
  con.config = {};
  con.depend = false;

  con.prototype.open = function(host, port, recon) {
	if(typeof host === 'string'){
		con.port = port || con.port;
		con.host = host || con.host;
		con.recon = recon ? recon : con.recon;
	} else {
		con.port = host.port || con.port;
		con.host = host.host || con.host;
		con.recon = host.recon ? host.recon : host.recon;
		con.config = host.config || con.config;
		con.depend = host.depend || con.depend;
	}
	con.r = function(res){ // function to handle all responses from Mongo
		reply(con,res);
	};
    con.c = new net.createConnection(con.port, con.host); //creates the connection
    con.c.addListener('connect', function() { // Mongo responds for the first time
	  var MasterCmd;
      process.stderr.write("connecting...\n");
      con.c.setTimeout(0);
      con.c.setNoDelay();

      MasterCmd = {
        collectionName: 'mongous.$cmd',
        queryOptions: 16,
        numberToSkip: 0,
        numberToReturn: -1,
        query: {
          ismaster: 1 // TODO!!!!! Check for replica-sets with 'ismaster' command! Then connect to primary.
        },
        returnFieldSelector: null
      };
      return con.c.write(com.binary(MasterCmd, 2004, 0), 'binary'); // this makes us the master of Mongo

    });
	function start(m){
		var spawn = require('child_process').spawn,
			config = [];
		con.config.port = con.config.port || con.port;
		con.config.bind_ip = con.config.bind_ip || con.config.host || con.host;
		for(var i in con.config){
			if(__hasProp.call(con.config,i)){
				config.push('--'+i);
				if(con.config[i] !== true){
					config.push(con.config[i]);
				}
			}
		}
		con.local = (con.config.bind_ip.toLowerCase() === 'localhost' || con.config.bind_ip === '127.0.0.1')? true : false;
		if(!con.local || con.depend){ return; }
		if(process.env.MONGOUS_LOCK != undefined
		&& process.env.MONGOUS_LOCK != process.pid){
			return setTimeout(function(){ m.open(con.host,con.port) }, 100);
		}
		process.env.MONGOUS_LOCK = process.pid;
		if(!start.count){
			start.count += 1;
			return setTimeout(function(){ start(m) }, 50);
		}
		var mongod = spawn('mongod',config);
		mongod.on('exit',function(c,s){
			if(process.env.MONGOUS_LOCK == process.pid){
				process.env.MONGOUS_LOCK = ''; // 0 and false don't work, cause they are cast to strings!
			}
			log("Mongod exited");
			start(m); // don't want auto-restart? Set depend = true.
		});
		mongod.stderr.on('data',function(d){
			log(d.toString());
		});
		mongod.stdout.setEncoding('utf8');
		mongod.stdout.on('data', __bind(function (data) {
			if (/\[initandlisten\] waiting for connections on port/.test(data)){
				m.open(con.host,con.port);
			}
		}, m));
	};
	start.count = 0;
    con.c.addListener('error', __bind(function(e) {
		if(e && e.code == 'ECONNREFUSED'){
			if((require('fs').existsSync||require('path').existsSync)('/usr/local/bin/mongod')) start(this);
		} else {
			log('Mongous : '+e);
			//return con.c.emit('error', e);
		}
    }, this));
    con.c.addListener('close', __bind(function() {
		//return con.c.emit('close');
    }, this));
	con.c.som = 0;
	con.c.br = 0;
	con.c.b = new Buffer(0);
	con.c.sb = '';
    con.c.addListener('data', con.r); // listen for it!
	return con.c;
  };

  con.prototype.close = function() {
    if (con.c) {
      return con.c.end();
    }
  };
  con.prototype.send = function(cmd) { // receive BSON command
    var nc, send = (function(e){
      if(con.c._connecting) { // if we are in the middle of connecting
        con.msg.push(cmd); // queue the commands in order
		con.ccc = (function(c) { // listen for when we are connected
			var _results;
			_results = [];
			while (con.msg.length > 0) { //then shuffle them out to Mongo
				_results.push(c.write(con.msg.shift(), 'binary'));
			}
			return _results;
		});
      } else if (con.recon) { // n-m-n thing, was broken. I assume it does the same as above, except during reconnect
        con.msg.push(cmd);
        if (con.c.currently_reconnecting === null) {
          con.c.currently_reconnecting = true;
          nc = net.createConnection(con.port, con.host);
          return nc.addListener('connect', __bind(function() {
            var _results;
            this.setTimeout(0);
            this.setNoDelay();
            this.addListener('data', con.r);
            con.c = this;
            _results = [];
            while (con.msg.length > 0) {
              _results.push(this.write(con.msg.shift(), 'binary'));
            }
            return _results;
          }, this));
        }
      } else {
				//console.log(con.c);
        process.stderr.write('Error: readyState not defined\n');
        return false;
      }
    });
		if(con.s){
			try {
				return con.c.write(cmd, 'binary'); // send it to Mongo
			}catch(e) {
				process.stderr.write("MONGOUS.con.send -> con.c.write fail\n");
				send();
			}
		} else {
			send();
		}
  };
  con.prototype.log = function(info) {
    process.stderr.write('log', " - " + info + '\n');
    return false;
  };
  con.prototype.leg = function(error) {
    process.stderr.write(" - Error: " + error.toString().replace(/error:/i, '') + '\n');
    return false;
  };
  return con;
}();
mongous = function() {
  __extends(mongous, con);
  function mongous(s) { // checks for a valid db and collection name
	 if(!s) return false;
    var e, p;
    e = false;
    if (con.c === null) { // if we haven't connected yet, then connect
      this.open(con.host,con.port);
    }
    if (s.length >= 80) {
      process.stderr.write("Error: '" + s + "' - Database name and collection exceed 80 character limit.\n");
      e = true;
    }
    p = s.search(/\./);
    if (p <= 0) {
      process.stderr.write("Error: '" + s + "' - Database.collection nomenclature required\n");
      e = true;
    }
    this.db = s.slice(0, p);
    this.col = s.substr(p + 1);
		if(this.col != '$cmd') {
			if (this.col.search(/\$/) >= 0) {
				if (this.col.search(/\$cmd/i) < 0) {
				process.stderr.write("Error: '" + s + "' - cannot use '$' unless for commands.\n");
				e = true;
				} else {
				process.stderr.write("Error: '" + s + "' - silent.\n");
				e = true;
				}
			} else
			if (this.col.search(/^[a-z|\_]/i) < 0) {
				process.stderr.write("Error: '" + s + "' - Collection must start with a letter or an underscore.\n");
				e = true;
			}
		}
    if (e) {
      this.db = '!';
      this.col = '$';
    }
    this;
  }
  mongous.prototype.auth = function() {
	  var usr, pwd, self, fn;
	  usr = arguments[0], pwd = arguments[1], fn = arguments[2];
	  if(!usr || !pwd) {
		  process.stderr.write("User and password required.\n");
		  return false;
	  }
	  self = this;
	  this.find({getnonce:1}, function(r) {
		  var n = r.documents[0].nonce;
		  self.find({
			  authenticate: 1,
			  user: usr,
			  nonce: n,
			  key: MD5.hex_md5(n+usr+MD5.hex_md5(usr+":mongo:"+pwd))
		  }, function(res) {
			  if(fn) {
				return fn(res);
			  }
		  }, 1);
	  }, 1);
  }
  mongous.prototype.open = function() {
    return mongous.__super__.open.apply(this, arguments);
  };
  mongous.prototype.send = function(cmd, op, id) {
    if (cmd.collectionName === '!.$') { // YIPES! Invalid db and col!
      return false;
    } else { // safe :)
      id || (id = this.id());

      return mongous.__super__.send.call(this, com.binary(cmd, op, id)); // convert to binary, send to connection
    }
  };
  mongous.prototype.update = function() {
    var a, b, c, cmd, m, u;
    a = arguments[0], b = arguments[1], c = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
    if (!a || !b) {
      process.stderr.write("Query and document required.\n");
    }
    if (c[0] || c.length === 2) {
      if (c[0] instanceof Object) {
        m = c[0].multi ? 1 : 0;
        u = c[0].upsert ? 1 : 0;
      } else {
        u = c[0] ? 1 : 0;
        m = c[1] ? 1 : 0;
      }
    } else {
      m = u = 0;
    }
    cmd = {
      collectionName: this.db + '.' + this.col,
      flags: parseInt(m.toString() + u.toString()),
      spec: a,
      document: b
    };
    return this.send(cmd, 2001);
  };
  var CID = 0;
  mongous.prototype.find = function() {
    var a, cmd, docs, f, fn, i, id, it, num, o, obj, q, _i, _len;
    a = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (!a) {
      this.leg("Callback required");
    }
    obj = [];
    num = [];
    for (_i = 0, _len = a.length; _i < _len; _i++) {
      i = a[_i];
      if (Object.prototype.toString.call(i) === "[object Function]") {
        fn = i;
      } else if (Object.prototype.toString.call(i) === "[object Object]") {
        obj.push(i);
      } else if (!isNaN(i)) {
        num.push(i);
      }
    }
    q = obj[0] ? obj[0] : {};
    f = obj[1] ? obj[1] : null;
    o = obj[2] ? obj[2] : {};
	if(o.join != void 0) {

	}
  if(o.sort != void 0) {
		q = {$query: q, $orderby: o.sort};
	}
    // auto convert from _id string to ObjectID
  if(q._id && typeof q._id === 'string' && /^[0-9a-f]{24}$/.test(q._id)){
    q._id = new ObjectID(q._id);
  }
	o.lim = o.lim !== void 0 ? o.lim : num[0] ? num[0] : 0;
    o.skip = o.skip !== void 0 ? o.skip : num[1] ? num[1] : 0;
    cmd = {
      collectionName: (o.$db || this.db) + '.' + (o.$col || this.col),
      numberToSkip: o.skip,
      numberToReturn: o.lim,
      query: q,
      returnFieldSelector: f
    };
    id = this.id();
    docs = [];
    it = 0;
	con.reply[id.toString()] = __bind(function(msg){
		var lim;
		it += msg.numberReturned;
		if (msg.more && o.lim == 0) {
			//lim = o.lim - it < 500 ? 500 : o.lim - it;
			this.more(cmd.collectionName, 500, msg.cursorID, id);
		} else {
			delete con.reply[id.toString()];
		}
		var next = __bind(function(wait, a){
			if(o.join && wait && a) {
				if(a.obj(wait).each(function(v,i){
					if(v) return v;
				})){ return }
			}
			if (fn) {
				return fn(msg);
			}
		},this);
		var self = this;
		if(o.join && msg.documents && msg.documents.length){
			var a = require('theory')()
			, docs = msg.documents
			, wait = {};
			a.obj(o.join).each(function(to, on, t){
				wait[on] = 1;
				var q = {}, db, col;
				if(to[0] === '$'){
					to = to.split('.');
					db = to.shift().replace('$','');
					to = '.' + to.join('.');
				}
				if(to[0] === '.'){
					to = to.split('.');
					to.shift(); // get rid of empty ''.
					col = to.shift();
					to = to.join('.');
				}
				q[to] = {$in:[]};
				a.list(docs).each(function(doc,i){
					if(doc && (i = a(doc, on)) !== undefined){
						q[to].$in.push(i);
					}
				});
				self.find(q, {}, {$db: db, $col: col}, function(m){
					if(m && m.documents && m.documents.length){
						a.list(m.documents).each(function(doc,val,t){
							if(doc && (val = a(doc,to)) !== undefined){
								a.list(docs).each(function(at){
									var w = {
										l: on.split('.').length
										,f: a.text(on).clip('.',-1)
										,p: a.text(on).clip('.',0,-1)
									};
									w.o = w.l === 1? at : a(at, o.p);
									if(w.o[w.f] === val){
										w.o[w.f] = doc;
									}
								});
							}
						});
					}
					wait[on] = 0;
					next(wait, a);
				});
			});
		} else {
			next();
		}
    },this);
    return this.send(cmd, 2004, id);
  };
  mongous.prototype.remove = function() {
    var a, b, cmd, m, r = 0; // r=reserved & must be 0 (as per the spec)
    a = arguments[0], b = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    if (!a) {
      process.stderr.write("Query required.\n");
    }
    if (b[0] || b.length === 1) {
      m = b[0] ? 1 : 0; // atomic
    } else {
      m = 0;
    }
    cmd = {
      collectionName: this.db + '.' + this.col,
      flags: parseInt(m.toString() + r.toString()),
      spec: a
    };
    return this.send(cmd, 2006);
  };
  mongous.prototype.more = function(a, b, c, d) {
    var cmd;
    cmd = {
      collectionName: a,
      numberToReturn: b,
      cursorID: c
    };
    return this.send(cmd, 2005, d);
  };
  mongous.prototype.insert = function() {
    var a, cmd, docs;
    a = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    docs = a[0] instanceof Array ? a[0] : a;
    cmd = {
      collectionName: this.db + '.' + this.col,
      documents: docs
    };
    return this.send(cmd, 2002);
  };
  mongous.prototype.save = function(a) {
    return this.update(a, a, 1);
  };
  mongous.prototype.log = function(info) {
    return this.emit('log', " - " + info);
  };
  mongous.prototype.leg = function(error) {
    return this.emit('log', " - Error: " + error.toString().replace(/error:/i, ''));
  };
  mongous.prototype.id = function() {
    return Math.round(Math.random() * 80000);
  };
  return mongous;
}();
db = function() {
  function db(s) {
    return new mongous(s);
  }
  return db;
}();
exports.Mongous = db;
