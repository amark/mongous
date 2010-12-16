var bp, com, command, con, db, ee, i, j, mongous, mr, net;
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
ee = require('events').EventEmitter;
com = require('./commands').Commands;
mr = require('./responses/mongo_reply').MongoReply;
command = require('./commands').Commands;
con = function() {
  function con() {
    con.__super__.constructor.apply(this, arguments);
  }
  __extends(con, ee);
  con.c = null;
  con.s = false;
  con.d = true;
  con.msg = [];
  con.ms = 0;
  con.byt = 0;
  con.b = '';
  con.bb = '';
  con.port = 27017;
  con.host = '127.0.0.1';
  con.recon = false;
  con.prototype.open = function(port, host, recon) {
    con.port = port ? port : con.port;
    con.host = host ? port : con.host;
    con.recon = recon ? recon : con.recon;
    con.c = net.createConnection(con.port, con.host);
    con.c.setEncoding('binary');
    con.c.addListener('connect', function() {
      var MasterCmd;
      //console.log("connecting...");
      con.c.setEncoding('binary');
      con.c.setTimeout(0);
      con.c.setNoDelay();
      MasterCmd = {
        op: 2004,
        collectionName: 'mongous.$cmd',
        queryOptions: 16,
        numberToSkip: 0,
        numberToReturn: -1,
        query: {
          ismaster: 1
        },
        returnFieldSelector: null
      };
      return con.c.write(command.binary(MasterCmd), 'binary');
    });
    con.c.addListener('error', __bind(function(e) {
      return con.c.emit('error', e);
    }, this));
    con.c.addListener('close', __bind(function() {
      return con.c.emit('close');
    }, this));
    return con.c.addListener('data', function(res) {
      var bytr, r, som;
      if (con.byt > 0 && con.som > 0) {
        bytr = con.som - con.byt;
        if (bytr > res.length) {
          con.b += res;
          con.byt += res.length;
        } else {
          con.b += res.substr(0, bytr);
          //console.log('data 1');
          r = new mr(con.b);
          if (r.responseFlag > 0) {
            //console.log(r);
          }
          con.b = '';
          con.byt = 0;
          con.som = 0;
        }
        if (bytr < res.length) {
          //console.log('data 0');
          //console.log(res.substr(bytr, res.length - bytr));
        }
      } else if (con.bb.length > 0) {
        res = con.bb + res;
        con.bb = '';
      }
      if (res.length > 4) {
        som = bp.toInt(res.substr(0, 4));
        if (som > res.length) {
          con.b += res;
          con.byt = res.length;
          return con.som = som;
        } else if (som === res.length) {
          //console.log('data 2');
          r = new mr(res);
          if (r.responseFlag > 0) {
            //console.log(r);
          }
          try {
            if (r.documents[0].ismaster) {
              con.s = true;
              con.c.emit('connected', con.s);
              return //console.log('emitted connected');
            } else {
              return con.s = false;
            }
          } catch (e) {
            return con.s = false;
          }
        } else if (som < res.length) {
          //console.log('data 3');
          r = new mr(res.substr(0, som));
          if (r.responseFlag > 0) {
            //console.log(r);
          }
          return //console.log(res.substr(som, res.length - som));
        }
      } else {
        return s.bb = res;
      }
    });
  };
  con.prototype.close = function() {
    if (con.c) {
      return con.c.end();
    }
  };
  con.prototype.send = function(cmd) {
    var nc;
    //console.log(con.c);
    try {
      return con.c.write(cmd, 'binary');
    } catch (e) {
      if (con.c._connecting) {
        //console.log('waiting to connect');
        con.msg.push(cmd);
        con.c.addListener('connected', __bind(function(v) {
          var _results;
          //console.log('finished connecting!');
          if (v) {
            _results = [];
            while (con.msg.length > 0) {
              //console.log(con.msg);
              _results.push(con.c.write(con.msg.shift(), 'binary'));
            }
            return _results;
          }
        }, this));
      }
      if (con.c.readyState !== 'open' && con.recon) {
        con.msg.push(cmd);
        if (con.c.currently_reconnecting === null) {
          con.c.currently_reconnecting = true;
          nc = net.createConnection(con.port, con.host);
          nc.setEncoding('binary');
          return nc.addListener('connect', __bind(function() {
            var _results;
            this.setEncoding('binary');
            this.setTimeout(0);
            this.setNoDelay();
            this.addListener('data', con.c.receiveListener);
            con.c = this;
            _results = [];
            while (con.msg.length > 0) {
              _results.push(this.write(con.msg.shif(), 'binary'));
            }
            return _results;
          }, this));
        }
      } else {
        return //console.log('readyState not defined');
      }
    }
  };
  con.prototype.log = function(info) {
    return //console.log('log', " - " + info);
  };
  con.prototype.leg = function(error) {
    return this.emit('log', " - Error: " + error.toString().replace(/error:/i, ''));
  };
  return con;
}();
mongous = function() {
  __extends(mongous, con);
  function mongous(s) {
    var p;
    if (con.c === null) {
      this.open();
    }
    if (s.length >= 80) {
      //console.log("Database name and collection exceed 80 character limit.");
    }
    p = s.search(/\./);
    if (p <= 0) {
      //console.log("Database.collection nomenclature required");
    }
    this.db = s.slice(0, p);
    this.col = s.substr(p + 1);
    if (this.col.search(/\$/) >= 0) {
      if (this.col.search(/\$cmd/i) < 0) {
        //console.log(" cannot use '$' unless for commands.");
      } else {
        //console.log("silent.");
      }
    } else if (this.col.search(/^[a-z|\_]/i) < 0) {
      //console.log("Collection must start with a letter or an underscore.");
    }
    this;
  }
  mongous.prototype.open = function() {
    return mongous.__super__.open.apply(this, arguments);
  };
  mongous.prototype.send = function(cmd) {
    return mongous.__super__.send.call(this, com.binary(cmd));
  };
  mongous.prototype.update = function() {
    var a, b, c, cmd, m, u, z, _i;
    a = arguments[0], b = arguments[1], c = 4 <= arguments.length ? __slice.call(arguments, 2, _i = arguments.length - 1) : (_i = 2, []), z = arguments[_i++];
    if (!a || !b) {
      this.leg("Query and document required.");
    }
    /* to do: check namespaces #*/
    if (typeof z !== 'function') {
      c[0] = z;
    }
    if (c[0]) {
      m = c[0].multi ? 1 : 0;
      u = c[0].upsert ? 1 : 0;
    } else {
      u = m = 0;
    }
    //console.log('FLAGS:' + parseInt(m.toString() + u.toString()));
    cmd = {
      op: 2001,
      collectionName: this.db + '.' + this.col,
      flags: parseInt(m.toString() + u.toString()),
      spec: a,
      document: b
    };
    //console.log(cmd);
    return this.send(cmd);
  };
  mongous.prototype.query = function(a) {
    var cmd;
    a = a === null ? {} : a;
    cmd = {
      op: 2004,
      collectionName: this.db + '.' + this.col,
      numberToSkip: 0,
      numberToReturn: -1,
      query: a,
      returnFieldSelector: null
    };
    return this.send(cmd);
  };
  mongous.prototype.insert = function(a) {
    var cmd;
    cmd = {
      op: 2002,
      collectionName: this.db + '.' + this.col,
      documents: a
    };
    return this.send(cmd);
  };
  mongous.prototype.save = function(a) {
    return //console.log('save');
  };
  mongous.prototype.log = function(info) {
    return this.emit('log', " - " + info);
  };
  mongous.prototype.leg = function(error) {
    return this.emit('log', " - Error: " + error.toString().replace(/error:/i, ''));
  };
  return mongous;
}();
db = function(s) {
  return new mongous(s);
};
for (i = 0; i <= 100; i++) {
  for (j = 0; j < 1000; j++) {
	 console.log(i + ": " + j);
    db('angry.mob' + i).update({
      foo: j
    }, {
      $set: {
        bar: j + 1
      }
    }, {
      upsert: true,
      multi: true
    });
  }
}