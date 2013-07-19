var BinaryParser = require('./bson/binary_parser').BinaryParser;
var BSON = require('./bson/bson').BSON;
var OrderedHash = require('./bson/collections').OrderedHash;

/**
  Base object used for common functionality
**/
var Commands = exports.Commands = function() {
  return (this).Commands
};

insert = function(c) {
  // Calculate total length of the document
  var totalLengthOfCommand = 4 + Buffer.byteLength(c.collectionName) + 1 + (4 * 4);
  // var docLength = 0
  for(var i = 0; i < c.documents.length; i++) {
    // Calculate size of document
    totalLengthOfCommand += BSON.calculateObjectSize(c.documents[i]);
  }
    
  // Let's build the single pass buffer command
  var _index = 0;
  var _command = new Buffer(totalLengthOfCommand);
  // Write the header information to the buffer
  _command[_index + 3] = (totalLengthOfCommand >> 24) & 0xff;     
  _command[_index + 2] = (totalLengthOfCommand >> 16) & 0xff;
  _command[_index + 1] = (totalLengthOfCommand >> 8) & 0xff;
  _command[_index] = totalLengthOfCommand & 0xff;
  // Adjust index
  _index = _index + 4;
  // Write the request ID
  _command[_index + 3] = (c.requestId >> 24) & 0xff;     
  _command[_index + 2] = (c.requestId >> 16) & 0xff;
  _command[_index + 1] = (c.requestId >> 8) & 0xff;
  _command[_index] = c.requestId & 0xff;
  // Adjust index
  _index = _index + 4;
  // Write zero
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;
  // Write the op_code for the command
  _command[_index + 3] = (Commands.OP_INSERT >> 24) & 0xff;     
  _command[_index + 2] = (Commands.OP_INSERT >> 16) & 0xff;
  _command[_index + 1] = (Commands.OP_INSERT >> 8) & 0xff;
  _command[_index] = Commands.OP_INSERT & 0xff;
  // Adjust index
  _index = _index + 4;
  // Write zero
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;
  // Write the collection name to the command
  _index = _index + _command.write(c.collectionName, _index, 'utf8') + 1;
  _command[_index - 1] = 0;
  
  // Write all the bson documents to the buffer at the index offset
  for(var i = 0; i < c.documents.length; i++) {
    // Serialize the document straight to the buffer
    var documentLength = BSON.serializeWithBufferAndIndex(c.documents[i], c.checkKeys, _command, _index) - _index + 1;
    // Write the length to the document
    _command[_index + 3] = (documentLength >> 24) & 0xff;     
    _command[_index + 2] = (documentLength >> 16) & 0xff;
    _command[_index + 1] = (documentLength >> 8) & 0xff;
    _command[_index] = documentLength & 0xff;
    // Update index in buffer
    _index = _index + documentLength;
    // Add terminating 0 for the object
    _command[_index - 1] = 0;    
  }
  
  return _command;
};

more = function(c) {
  // debug("======================================================= GETMORE")
  // debug("================ " + BSON.calculateObjectSize(c.query))
  // Calculate total length of the document
  var totalLengthOfCommand = 4 + Buffer.byteLength(c.collectionName) + 1 + 4 + 8 + (4 * 4);
  // Let's build the single pass buffer command
  var _index = 0;
  var _command = new Buffer(totalLengthOfCommand);
  // Write the header information to the buffer
  _command[_index + 3] = (totalLengthOfCommand >> 24) & 0xff;     
  _command[_index + 2] = (totalLengthOfCommand >> 16) & 0xff;
  _command[_index + 1] = (totalLengthOfCommand >> 8) & 0xff;
  _command[_index] = totalLengthOfCommand & 0xff;
  // Adjust index
  _index = _index + 4;
  // Write the request ID
  _command[_index + 3] = (c.requestId >> 24) & 0xff;     
  _command[_index + 2] = (c.requestId >> 16) & 0xff;
  _command[_index + 1] = (c.requestId >> 8) & 0xff;
  _command[_index] = c.requestId & 0xff;
  // Adjust index
  _index = _index + 4;
  // Write zero
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;
  // Write the op_code for the command
  _command[_index + 3] = (Commands.OP_GET_MORE >> 24) & 0xff;     
  _command[_index + 2] = (Commands.OP_GET_MORE >> 16) & 0xff;
  _command[_index + 1] = (Commands.OP_GET_MORE >> 8) & 0xff;
  _command[_index] = Commands.OP_GET_MORE & 0xff;
  // Adjust index
  _index = _index + 4;

  // Write zero
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;

  // Write the collection name to the command
  _index = _index + _command.write(c.collectionName, _index, 'utf8') + 1;
  _command[_index - 1] = 0;    

  // Number of documents to return
  _command[_index + 3] = (c.numberToReturn >> 24) & 0xff;     
  _command[_index + 2] = (c.numberToReturn >> 16) & 0xff;
  _command[_index + 1] = (c.numberToReturn >> 8) & 0xff;
  _command[_index] = c.numberToReturn & 0xff;
  // Adjust index
  _index = _index + 4;
  
  // Encode the cursor id
  var low_bits = c.cursorID.getLowBits();
  // Encode low bits
  _command[_index + 3] = (low_bits >> 24) & 0xff;     
  _command[_index + 2] = (low_bits >> 16) & 0xff;
  _command[_index + 1] = (low_bits >> 8) & 0xff;
  _command[_index] = low_bits & 0xff;
  // Adjust index
  _index = _index + 4;
  
  var high_bits = c.cursorID.getHighBits();
  // Encode high bits
  _command[_index + 3] = (high_bits >> 24) & 0xff;     
  _command[_index + 2] = (high_bits >> 16) & 0xff;
  _command[_index + 1] = (high_bits >> 8) & 0xff;
  _command[_index] = high_bits & 0xff;
  // Adjust index
  _index = _index + 4;
  
  return _command;
};

kill = function(c) {
  // Calculate total length of the document
  var totalLengthOfCommand = 4 + 4 + (4 * 4) + (c.cursorIDs.length * 8);
  // Let's build the single pass buffer command
  var _index = 0;
  var _command = new Buffer(totalLengthOfCommand);
  // Write the header information to the buffer
  _command[_index + 3] = (totalLengthOfCommand >> 24) & 0xff;     
  _command[_index + 2] = (totalLengthOfCommand >> 16) & 0xff;
  _command[_index + 1] = (totalLengthOfCommand >> 8) & 0xff;
  _command[_index] = totalLengthOfCommand & 0xff;
  // Adjust index
  _index = _index + 4;
  // Write the request ID
  _command[_index + 3] = (c.requestId >> 24) & 0xff;     
  _command[_index + 2] = (c.requestId >> 16) & 0xff;
  _command[_index + 1] = (c.requestId >> 8) & 0xff;
  _command[_index] = c.requestId & 0xff;
  // Adjust index
  _index = _index + 4;
  // Write zero
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;
  // Write the op_code for the command
  _command[_index + 3] = (Commands.OP_KILL_CURSORS >> 24) & 0xff;     
  _command[_index + 2] = (Commands.OP_KILL_CURSORS >> 16) & 0xff;
  _command[_index + 1] = (Commands.OP_KILL_CURSORS >> 8) & 0xff;
  _command[_index] = Commands.OP_KILL_CURSORS & 0xff;
  // Adjust index
  _index = _index + 4;

  // Write zero
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;

  // Number of cursors to kill
  var numberOfCursors = c.cursorIDs.length;
  _command[_index + 3] = (numberOfCursors >> 24) & 0xff;     
  _command[_index + 2] = (numberOfCursors >> 16) & 0xff;
  _command[_index + 1] = (numberOfCursors >> 8) & 0xff;
  _command[_index] = numberOfCursors & 0xff;
  // Adjust index
  _index = _index + 4;

  // Encode all the cursors
  for(var i = 0; i < c.cursorIDs.length; i++) {
    // Encode the cursor id
    var low_bits = c.cursorIDs[i].getLowBits();
    // Encode low bits
    _command[_index + 3] = (low_bits >> 24) & 0xff;     
    _command[_index + 2] = (low_bits >> 16) & 0xff;
    _command[_index + 1] = (low_bits >> 8) & 0xff;
    _command[_index] = low_bits & 0xff;
    // Adjust index
    _index = _index + 4;
      
    var high_bits = c.cursorIDs[i].getHighBits();
    // Encode high bits
    _command[_index + 3] = (high_bits >> 24) & 0xff;     
    _command[_index + 2] = (high_bits >> 16) & 0xff;
    _command[_index + 1] = (high_bits >> 8) & 0xff;
    _command[_index] = high_bits & 0xff;
    // Adjust index
    _index = _index + 4;
  }
  
  return _command;
};

update =  function(c) {
  // Calculate total length of the document
  var totalLengthOfCommand = 4 + Buffer.byteLength(c.collectionName) + 1 + 4 + BSON.calculateObjectSize(c.spec) +
      BSON.calculateObjectSize(c.document) + (4 * 4);

  // Let's build the single pass buffer command
  var _index = 0;
  var _command = new Buffer(totalLengthOfCommand);
  // Write the header information to the buffer
  _command[_index + 3] = (totalLengthOfCommand >> 24) & 0xff;     
  _command[_index + 2] = (totalLengthOfCommand >> 16) & 0xff;
  _command[_index + 1] = (totalLengthOfCommand >> 8) & 0xff;
  _command[_index] = totalLengthOfCommand & 0xff;
  // Adjust index
  _index = _index + 4;
  // Write the request ID
  _command[_index + 3] = (c.requestId >> 24) & 0xff;     
  _command[_index + 2] = (c.requestId >> 16) & 0xff;
  _command[_index + 1] = (c.requestId >> 8) & 0xff;
  _command[_index] = c.requestId & 0xff;
  // Adjust index
  _index = _index + 4;
  // Write zero
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;
  // Write the op_code for the command
  _command[_index + 3] = (Commands.OP_UPDATE >> 24) & 0xff;     
  _command[_index + 2] = (Commands.OP_UPDATE >> 16) & 0xff;
  _command[_index + 1] = (Commands.OP_UPDATE >> 8) & 0xff;
  _command[_index] = Commands.OP_UPDATE & 0xff;
  // Adjust index
  _index = _index + 4;

  // Write zero
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;

  // Write the collection name to the command
  _index = _index + _command.write(c.collectionName, _index, 'utf8') + 1;
  _command[_index - 1] = 0;    

  // Write the update flags
  _command[_index + 3] = (c.flags >> 24) & 0xff;     
  _command[_index + 2] = (c.flags >> 16) & 0xff;
  _command[_index + 1] = (c.flags >> 8) & 0xff;
  _command[_index] = c.flags & 0xff;
  // Adjust index
  _index = _index + 4;

  // Serialize the spec document
  var documentLength = BSON.serializeWithBufferAndIndex(c.spec, c.checkKeys, _command, _index) - _index + 1;
  // Write the length to the document
  _command[_index + 3] = (documentLength >> 24) & 0xff;     
  _command[_index + 2] = (documentLength >> 16) & 0xff;
  _command[_index + 1] = (documentLength >> 8) & 0xff;
  _command[_index] = documentLength & 0xff;
  // Update index in buffer
  _index = _index + documentLength;
  // Add terminating 0 for the object
  _command[_index - 1] = 0;    

  // Serialize the document
  var documentLength = BSON.serializeWithBufferAndIndex(c.document, c.checkKeys, _command, _index) - _index + 1;
  // Write the length to the document
  _command[_index + 3] = (documentLength >> 24) & 0xff;     
  _command[_index + 2] = (documentLength >> 16) & 0xff;
  _command[_index + 1] = (documentLength >> 8) & 0xff;
  _command[_index] = documentLength & 0xff;
  // Update index in buffer
  _index = _index + documentLength;
  // Add terminating 0 for the object
  _command[_index - 1] = 0;    

  return _command;
};

remove =  function(c) {
  // Calculate total length of the document
  var totalLengthOfCommand = 4 + Buffer.byteLength(c.collectionName) + 1 + 4 + BSON.calculateObjectSize(c.spec||c.selector) + (4 * 4);
  // Let's build the single pass buffer command
  var _index = 0;
  var _command = new Buffer(totalLengthOfCommand);
  // Write the header information to the buffer
  _command[_index + 3] = (totalLengthOfCommand >> 24) & 0xff;     
  _command[_index + 2] = (totalLengthOfCommand >> 16) & 0xff;
  _command[_index + 1] = (totalLengthOfCommand >> 8) & 0xff;
  _command[_index] = totalLengthOfCommand & 0xff;
  // Adjust index
  _index = _index + 4;
  // Write the request ID
  _command[_index + 3] = (c.requestId >> 24) & 0xff;     
  _command[_index + 2] = (c.requestId >> 16) & 0xff;
  _command[_index + 1] = (c.requestId >> 8) & 0xff;
  _command[_index] = c.requestId & 0xff;
  // Adjust index
  _index = _index + 4;
  // Write zero
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;
  // Write the op_code for the command
  _command[_index + 3] = (Commands.OP_DELETE >> 24) & 0xff;     
  _command[_index + 2] = (Commands.OP_DELETE >> 16) & 0xff;
  _command[_index + 1] = (Commands.OP_DELETE >> 8) & 0xff;
  _command[_index] = Commands.OP_DELETE & 0xff;
  // Adjust index
  _index = _index + 4;

  // Write zero
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;

  // Write the collection name to the command
  _index = _index + _command.write(c.collectionName, _index, 'utf8') + 1;
  _command[_index - 1] = 0;    

  // Write zero
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;
  
  // Serialize the selector
  var documentLength = BSON.serializeWithBufferAndIndex(c.spec||c.selector, c.checkKeys, _command, _index) - _index + 1;
  // Write the length to the document
  _command[_index + 3] = (documentLength >> 24) & 0xff;     
  _command[_index + 2] = (documentLength >> 16) & 0xff;
  _command[_index + 1] = (documentLength >> 8) & 0xff;
  _command[_index] = documentLength & 0xff;
  // Update index in buffer
  _index = _index + documentLength;
  // Add terminating 0 for the object
  _command[_index - 1] = 0;      
  return _command;
};

query = function(c) {
  // debug("======================================================= QUERY")
  // debug("================ " + BSON.calculateObjectSize(c.query))
  
  // Calculate total length of the document
  var totalLengthOfCommand = 4 + Buffer.byteLength(c.collectionName) + 1 + 4 + 4 + BSON.calculateObjectSize(c.query) + (4 * 4);
  // Calculate extra fields size
  if(c.returnFieldSelector != null)  {
    if(Object.keys(c.returnFieldSelector).length > 0) {
      totalLengthOfCommand += BSON.calculateObjectSize(c.returnFieldSelector);
    }
  }

  // Let's build the single pass buffer command
  var _index = 0;
  var _command = new Buffer(totalLengthOfCommand);
  // Write the header information to the buffer
  _command[_index + 3] = (totalLengthOfCommand >> 24) & 0xff;     
  _command[_index + 2] = (totalLengthOfCommand >> 16) & 0xff;
  _command[_index + 1] = (totalLengthOfCommand >> 8) & 0xff;
  _command[_index] = totalLengthOfCommand & 0xff;
  // Adjust index
  _index = _index + 4;
  // Write the request ID
  _command[_index + 3] = (c.requestId >> 24) & 0xff;     
  _command[_index + 2] = (c.requestId >> 16) & 0xff;
  _command[_index + 1] = (c.requestId >> 8) & 0xff;
  _command[_index] = c.requestId & 0xff;
  // Adjust index
  _index = _index + 4;
  // Write zero
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;
  _command[_index++] = 0;
  // Write the op_code for the command
  _command[_index + 3] = (Commands.OP_QUERY >> 24) & 0xff;     
  _command[_index + 2] = (Commands.OP_QUERY >> 16) & 0xff;
  _command[_index + 1] = (Commands.OP_QUERY >> 8) & 0xff;
  _command[_index] = Commands.OP_QUERY & 0xff;
  // Adjust index
  _index = _index + 4;

  // Write the query options
  _command[_index + 3] = (c.queryOptions >> 24) & 0xff;     
  _command[_index + 2] = (c.queryOptions >> 16) & 0xff;
  _command[_index + 1] = (c.queryOptions >> 8) & 0xff;
  _command[_index] = c.queryOptions & 0xff;
  // Adjust index
  _index = _index + 4;

  // Write the collection name to the command
  _index = _index + _command.write(c.collectionName, _index, 'utf8') + 1;
  _command[_index - 1] = 0;    
  
  // Write the number of documents to skip
  _command[_index + 3] = (c.numberToSkip >> 24) & 0xff;     
  _command[_index + 2] = (c.numberToSkip >> 16) & 0xff;
  _command[_index + 1] = (c.numberToSkip >> 8) & 0xff;
  _command[_index] = c.numberToSkip & 0xff;
  // Adjust index
  _index = _index + 4;

  // Write the number of documents to return
  _command[_index + 3] = (c.numberToReturn >> 24) & 0xff;     
  _command[_index + 2] = (c.numberToReturn >> 16) & 0xff;
  _command[_index + 1] = (c.numberToReturn >> 8) & 0xff;
  _command[_index] = c.numberToReturn & 0xff;
  // Adjust index
  _index = _index + 4;
    
  // Serialize the query document straight to the buffer
  var documentLength = BSON.serializeWithBufferAndIndex(c.query, c.checkKeys, _command, _index) - _index + 1;
  // debug(inspect("===================== documentLength :: " + documentLength))
  
  // Write the length to the document
  _command[_index + 3] = (documentLength >> 24) & 0xff;     
  _command[_index + 2] = (documentLength >> 16) & 0xff;
  _command[_index + 1] = (documentLength >> 8) & 0xff;
  _command[_index] = documentLength & 0xff;
  // Update index in buffer
  _index = _index + documentLength;
  // Add terminating 0 for the object
  _command[_index - 1] = 0;    

  // Push field selector if available
  if(c.returnFieldSelector != null)  {
    if(Object.keys(c.returnFieldSelector).length > 0) {
      var documentLength = BSON.serializeWithBufferAndIndex(c.returnFieldSelector, c.checkKeys, _command, _index) - _index + 1;
      // Write the length to the document
      _command[_index + 3] = (documentLength >> 24) & 0xff;     
      _command[_index + 2] = (documentLength >> 16) & 0xff;
      _command[_index + 1] = (documentLength >> 8) & 0xff;
      _command[_index] = documentLength & 0xff;
      // Update index in buffer
      _index = _index + documentLength;
      // Add terminating 0 for the object
      _command[_index - 1] = 0;    
    }
  }
  
  // debug("------------------------------------------------------------------------")
  // debug(inspect(_command))
  
  return _command;
};

Commands.binary = function(cmd, op, id) {
	// Get the command data structure
	cmd.requestId = id;
	cmd.checkKeys = cmd.checkKeys == null ? true : cmd.checkKeys;
	var command = '';
	switch(op) {
		case 2001: 
			command = update(cmd);
			return command;
		break;
		case 2002: 
			command = insert(cmd);
			return command;
		break;
		case 2004: 
			command = query(cmd);
			return command;
		break;
		case 2005: 
			command = more(cmd);
			return command;
		break;
		case 2006: 
			command = remove(cmd);
			return command;
		break;
		case 2007: 
			command = kill(cmd);
			return command;
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
