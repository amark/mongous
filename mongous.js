var db, ee, net;
var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
  for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
  function ctor() { this.constructor = child; }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor;
  child.__super__ = parent.prototype;
  return child;
}, __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
net = require('net');
ee = require('events').EventEmitter;
db = function() {
  __extends(db, ee);
  function db(s) {
    return new mongous(s);
  }
  mongous = function() {
    function fn(s) {
      var p;
      if (s.length >= 80) {
        console.log("Database name and collection exceed 80 character limit.");
      }
      p = s.search(/\./);
      if (p <= 0) {
        console.log("Database.collection nomenclature required");
      }
      this.db = s.slice(0, p);
      this.col = s.substr(p + 1);
      if (this.col.search(/\$/) >= 0) {
        if (this.col.search(/\$cmd/i) < 0) {
          console.log(" cannot use '$' unless for commands.");
        } else {
          console.log("silent.");
        }
      } else if (this.col.search(/^[a-z|\_]/i) < 0) {
        console.log("Collection must start with a letter or an underscore.");
      }
      this;
    }
    fn.prototype.update = function() {
      var a, b, c, cmd, z, _i;
      a = arguments[0], b = arguments[1], c = 4 <= arguments.length ? __slice.call(arguments, 2, _i = arguments.length - 1) : (_i = 2, []), z = arguments[_i++];
      if (!a || !b) {
        this.leg("Query and document required.");
      }
      /* to do: check namespaces #*/
      c[0] = c[0] ? 1 : 0;
      c[1] = c[1] ? 1 : 0;
      cmd = {
        collectionName: this.db(+'.' + this.col)
      };
      return this;
    };
    fn.prototype.save = function(a) {
      return "rejoice";
    };
    fn.prototype.log = function(info) {
      return this.emit('log', new Date()(+" - " + info));
    };
    fn.prototype.leg = function(error) {
      return this.emit('log', new Date()(+" - Error: " + error.toString().replace(/error:/i, '')));
    };
	 
	 fn.prototype.open = function(port, host) {
		 if (this.db+this.col != 'init') return false;
		 port || (port = 27017);
		 host || (host = '127.0.0.1');
		 console.log(port + ' ' + host);
		 this.connection = net.createConnection(port, host);
		 this.connection.setEncoding('binary');
		 this.connection.on('connect', function() {
			return this.emit('connected', true);
		 });
		 this.connection.on('error', function(e) {
			return this.emit('error', e);
		 });
		 return this.connection.on('close', function() {
			return this.emit('disconnected', true);
		 });
	  };
	  
    return fn;
  }();
  /*
  	connection: (port, host) ->
  		port or= 27017
  		host or= '
  		@connection = net.createConnection(port, host);
  		@connection.setEncoding("binary");
     */
  return db;
}();
db('in.it').open();