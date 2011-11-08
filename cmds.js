var BinaryParser = require('./bson/binary_parser').BinaryParser;
var BSON = require('./bson/bson').BSON;
var OrderedHash = require('./bson/collections').OrderedHash;

/**
  Base object used for common functionality
**/
var Commands = exports.Commands = function() {
  return this.Commands
};

insert = function(c) {
  var command_string = '';
  c.checkKeys = c.checkKeys == null ? true : c.checkKeys;
  for(var i = 0; i < c.documents.length; i++) {
    command_string = command_string + BSON.serialize(c.documents[i], c.checkKeys);
  }
  // Build the command string
  return BinaryParser.fromInt(0) + BinaryParser.encode_cstring(c.collectionName) + command_string;
};

more = function(c) {
  // Generate the command string
  return BinaryParser.fromInt(0) + BinaryParser.encode_cstring(c.collectionName) + BinaryParser.fromInt(c.numberToReturn) + BSON.encodeLong(c.cursorID);
};

kill = function(c) {
  // Generate the command string
  var command_string = BinaryParser.fromInt(0) + BinaryParser.fromInt(c.cursorIds.length);
  c.cursorIds.forEach(function(cursorId) {
    command_string = command_string + BSON.encodeLong(cursorId);
  });
  return command_string;
};

update =  function(c) {
  // Generate the command string
  var command_string = BinaryParser.fromInt(0) + BinaryParser.encode_cstring(c.collectionName);
  return command_string + BinaryParser.fromInt(c.flags) + BSON.serialize(c.spec) + BSON.serialize(c.document, false);
};

remove =  function(c) {
  // Generate the command string
  var command_string = BinaryParser.fromInt(0) + BinaryParser.encode_cstring(c.collectionName);
  return command_string + BinaryParser.fromInt(c.flags) + BSON.serialize(c.spec);
};

query = function(c) {
  // Generate the command string
  var command_string = BinaryParser.fromInt(c.queryOptions) + BinaryParser.encode_cstring(c.collectionName);
  command_string = command_string + BinaryParser.fromInt(c.numberToSkip) + BinaryParser.fromInt(c.numberToReturn);
  command_string = command_string + BSON.serialize(c.query);
  if(c.returnFieldSelector != null)  {
    // && (c.returnFieldSelector != {} ||)
    if(c.returnFieldSelector instanceof OrderedHash && c.returnFieldSelector.length > 0) {
      command_string = command_string + BSON.serialize(c.returnFieldSelector);
    } else if(c.returnFieldSelector.constructor == Object) {
      var count = 0; for(var name in c.returnFieldSelector) { count += 1; }
      if(count > 0) command_string = command_string + BSON.serialize(c.returnFieldSelector);
    }
  }
  return command_string;
};

Commands.binary = function(cmd, op, id) {
	// Get the command data structure
	var command = '';
	switch(op) {
		case 2001: 
			command = update(cmd);
		break;
		case 2002: 
			command = insert(cmd);
		break;
		case 2004: 
			command = query(cmd);
		break;
		case 2005: 
			command = more(cmd);
		break;
		case 2006: 
			command = remove(cmd);
		break;
		case 2007: 
			command = kill(cmd);
		break;
	}
	// Total Size of command
	var totalSize = 4*4 + command.length;
	// Create the command with the standard header file
	//var hd = BinaryParser.fromInt(totalSize) + BinaryParser.fromInt(id) + BinaryParser.fromInt(0) + BinaryParser.fromInt(op);
	//var s = hd + command;
	//console.log(s.toString());
	return BinaryParser.fromInt(totalSize) + BinaryParser.fromInt(id) + BinaryParser.fromInt(0) + BinaryParser.fromInt(op) + command;
};

// OpCodes
Commands.OP_REPLY = 1;
Commands.OP_MSG = 1000;
Commands.OP_UPDATE = 2001;
Commands.OP_INSERT = 2002;
Commands.OP_GET_BY_OID = 2003;
Commands.OP_QUERY = 2004;
Commands.OP_GET_MORE = 2005;
Commands.OP_DELETE = 2006;
Commands.OP_KILL_CURSORS = 2007;
Commands.documents = [];
