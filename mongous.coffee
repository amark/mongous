net = require('net')
ee  = require('events').EventEmitter

class db extends ee

	constructor: (s) ->
		return new mongous.fn s
		
	class mongous.fn
		constructor: (s) ->
			if s.length >= 80
				@leg "Database name and collection exceed 80 character limit."
			p = s.search /\./
			if p <= 0
				@leg "Database.collection nomenclature required"
			@db = s.slice 0, p
			@col = s.substr p+1
			if @col.search /\$/ >= 0
				if @col.search /\$cmd/i < 0
					@leg " cannot use '$' unless for commands."
				else @leg "silent."
			else if @col.search /^[a-z|\_]/i < 0
				@leg "Collection must start with a letter or an underscore."
			@

		update: (a, b, c..., z) ->
			if !a or !b
				@leg "Query and document required."
			### to do: check namespaces ####
			c[0] = if c[0] then 1 else 0
			c[1] = if c[1] then 1 else 0
			cmd =
				collectionName: @db +'.'+ @col
				
			@
		save: (a) ->
			alert "rejoice"
		log : (info) ->
			@emit 'log', new Date() +" - "+ info
		leg : (error) ->
			@emit 'log', new Date() +" - Error: "+ error.toString().replace(/error:/i, '')
	
	open: (port, host) ->
		port or= 27017;
		host or= 'localhost'
		console.log port + ' ' + host
		@connection = net.createConnection port, host
		@connection.setEncoding 'binary'
		@connection.on 'connect', () =>
			@emit 'connected', true
		@connection.on 'error', (e) =>
			@emit 'error', err
		@connection.on 'close', () =>
			@emit 'disconnected', true
	###		
	connection: (port, host) ->
		port or= 27017
		host or= '
		@connection = net.createConnection(port, host);
		@connection.setEncoding("binary");
    ###
	 
db('wicked.cool').save({ foo: 'bar' });