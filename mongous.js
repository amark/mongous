var bp, com, con, db, ee, mongous, mr, net;
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
  con.ms = 0;
  con.byt = 0;
  con.b = '';
  con.bb = '';
  con.port = 27017;
  con.host = '127.0.0.1';
  con.recon = false;
  con.prototype.open = function(host, port, recon) {
    con.port || (con.port = port);
    con.host || (con.host = host);
    con.recon = recon ? recon : con.recon;
    con.c = net.createConnection(con.port, con.host);
    con.c.setEncoding('binary');
    con.c.addListener('connect', function() {
      var MasterCmd;
      console.log("connecting...");
      con.c.setEncoding('binary');
      con.c.setTimeout(0);
      con.c.setNoDelay();
      MasterCmd = {
        collectionName: 'mongous.$cmd',
        queryOptions: 16,
        numberToSkip: 0,
        numberToReturn: -1,
        query: {
          ismaster: 1
        },
        returnFieldSelector: null
      };
      return con.c.write(com.binary(MasterCmd, 2004, 0), 'binary');
    });
    con.c.addListener('error', __bind(function(e) {
      return con.c.emit('error', e);
    }, this));
    con.c.addListener('close', __bind(function() {
      return con.c.emit('close');
    }, this));
    con.r = function(res) {
      var bytr, r, som;
      if (con.byt > 0 && con.som > 0) {
        bytr = con.som - con.byt;
        if (bytr > res.length) {
          con.b += res;
          con.byt += res.length;
        } else {
          con.b += res.substr(0, bytr);
          r = new mr(con.b);
          con.c.emit(r.responseTo.toString(), r);
          con.b = '';
          con.byt = 0;
          con.som = 0;
        }
        if (bytr < res.length) {
          return con.r(res.substr(bytr, res.length - bytr));
        }
      } else {
        if (con.bb.length > 0) {
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
            r = new mr(res);
            if (!con.s) {
              if (r.documents[0].ismaster) {
                con.s = true;
                console.log("connected!");
                return con.c.emit('connected', con.s);
              } else {
                return con.s = false;
              }
            } else {
              return con.c.emit(r.responseTo.toString(), r);
            }
          } else if (som < res.length) {
            r = new mr(res.substr(0, som));
            con.c.emit(r.responseTo.toString(), r);
            return con.r(res.substr(som, res.length - som));
          } else {
            return s.bb = res;
          }
        }
      }
    };
    return con.c.addListener('data', con.r);
  };
  con.prototype.close = function() {
    if (con.c) {
      return con.c.end();
    }
  };
  con.prototype.send = function(cmd) {
    var nc;
    console.log(cmd);
    try {
      return con.c.write(cmd, 'binary');
    } catch (e) {
      if (con.c._connecting) {
        con.msg.push(cmd);
        return con.c.addListener('connected', __bind(function() {
          var _results;
          _results = [];
          while (con.msg.length > 0) {
            _results.push(con.c.write(con.msg.shift(), 'binary'));
          }
          return _results;
        }, this));
      } else if (con.recon) {
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
        return console.log('Error: readyState not defined');
      }
    }
  };
  con.prototype.log = function(info) {
    return console.log('log', " - " + info);
  };
  con.prototype.leg = function(error) {
    return console.log(" - Error: " + error.toString().replace(/error:/i, ''));
  };
  return con;
}();
mongous = function() {
  __extends(mongous, con);
  function mongous(s) {
    var e, p;
    e = false;
    if (con.c === null) {
      this.open();
    }
    if (s.length >= 80) {
      console.log("Error: '" + s + "' - Database name and collection exceed 80 character limit.");
      e = true;
    }
    p = s.search(/\./);
    if (p <= 0) {
      console.log("Error: '" + s + "' - Database.collection nomenclature required");
      e = true;
    }
    this.db = s.slice(0, p);
    this.col = s.substr(p + 1);
    if (this.col.search(/\$/) >= 0) {
      if (this.col.search(/\$cmd/i) < 0) {
        console.log("Error: '" + s + "' - cannot use '$' unless for commands.");
        e = true;
      } else {
        console.log("Error: '" + s + "' - silent.");
        e = true;
      }
    } else if (this.col.search(/^[a-z|\_]/i) < 0) {
      console.log("Error: '" + s + "' - Collection must start with a letter or an underscore.");
      e = true;
    }
    if (e) {
      this.db = '!';
      this.col = '$';
    }
    this;
  }
  mongous.prototype.open = function() {
    return mongous.__super__.open.apply(this, arguments);
  };
  mongous.prototype.send = function(cmd, op, id) {
    if (cmd.collectionName === '!.$') {
      return false;
    } else {
      id || (id = this.id());
      return mongous.__super__.send.call(this, com.binary(cmd, op, id));
    }
  };
  mongous.prototype.update = function() {
    var a, b, c, cmd, m, u;
    a = arguments[0], b = arguments[1], c = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
    if (!a || !b) {
      console.log("Query and document required.");
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
  mongous.prototype.find = function() {
    var a, cmd, f, fn, i, id, num, o, obj, q, _i, _len;
    a = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (!a) {
      this.leg("Callback required");
    }
    obj = [];
    num = [];
    for (_i = 0, _len = a.length; _i < _len; _i++) {
      i = a[_i];
      if (i instanceof Function) {
        fn = i;
      } else if (i instanceof Object) {
        obj.push(i);
      } else if (!isNaN(i)) {
        num.push(i);
      }
    }
    q = obj[0] ? obj[0] : {};
    f = obj[1] ? obj[1] : null;
    o = obj[2] ? obj[2] : {};
    o = {
      lim: o.lim !== void 0 ? o.lim : num[0] ? num[0] : void 0,
      skip: o.skip !== void 0 ? o.skip : num[1] ? num[1] : 0
    };
    cmd = {
      collectionName: this.db + '.' + this.col,
      numberToSkip: o.skip,
      numberToReturn: o.lim,
      query: q,
      returnFieldSelector: f
    };
    id = this.id();
    con.c.addListener(id.toString(), __bind(function(msg) {
      if (fn) {
        fn(msg);
      }
      return con.c.removeListener(id.toString(), con.c.listeners(id.toString())[0]);
    }, this));
    return this.send(cmd, 2004, id);
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
    return Math.round(Math.exp(Math.random() * Math.log(100000)));
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