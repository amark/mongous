#PLEASE USE .js FILE

net = require('net')
bp = require('./bson/binary_parser').BinaryParser
ee  = require('events').EventEmitter
com = require('./commands').Commands
#oid = require('./bson').ObjectID
mr = require('./responses/mongo_reply').MongoReply

class con extends ee
	con.c = null
	con.r = null
	con.s = false
	con.d = true
	con.msg = []
	con.ms = 0
	con.byt = 0
	con.b = ''
	con.bb = ''
	con.port = 27017
	con.host = '127.0.0.1'
	con.recon = false
	
	open: (host, port, recon) ->
		con.port or= port
		con.host or= host
		con.recon = if recon then recon else con.recon
		con.c = net.createConnection con.port, con.host
		con.c.setEncoding 'binary'
		con.c.addListener 'connect', () ->
			console.log "connecting..."
			con.c.setEncoding 'binary'
			con.c.setTimeout 0
			con.c.setNoDelay()
			MasterCmd =
				collectionName: 'mongous.$cmd'
				queryOptions: 16
				numberToSkip: 0
				numberToReturn: -1
				query: { ismaster: 1 }
				returnFieldSelector: null
			con.c.write( com.binary(MasterCmd,2004,0), 'binary' )
		con.c.addListener 'error', (e) =>
			con.c.emit 'error', e
		con.c.addListener 'close', () =>
			con.c.emit 'close'
		con.r = (res) ->
			if con.byt > 0 and con.som > 0
				bytr = con.som - con.byt
				if bytr > res.length
					con.b += res
					con.byt += res.length
				else
					con.b += res.substr 0, bytr
					r = new mr(con.b)
					con.c.emit r.responseTo.toString(), r
					con.b = ''
					con.byt = 0
					con.som = 0
				if bytr < res.length
					con.r(res.substr bytr, res.length-bytr)
			else 
				if con.bb.length > 0
					res = con.bb + res
					con.bb = ''
				if res.length > 4
					som = bp.toInt(res.substr 0, 4)
					if som > res.length
						con.b += res
						con.byt = res.length
						con.som = som
					else if som == res.length
						r = new mr(res)
						if !con.s
							if r.documents[0].ismaster
								con.s = true
								console.log "connected!"
								con.c.emit 'connected', con.s
							else con.s = false
						else
							con.c.emit r.responseTo.toString(), r
					else if som < res.length
						r = new mr(res.substr 0, som)
						con.c.emit r.responseTo.toString(), r
						con.r(res.substr som, res.length-som)
					else s.bb = res
		con.c.addListener 'data', con.r
	close: () ->
		if con.c then con.c.end()
	
	send: (cmd) ->
		console.log cmd
		try
			con.c.write cmd, 'binary'
		catch e
			if con.c._connecting
				con.msg.push cmd
				con.c.addListener 'connected', () =>
					while con.msg.length > 0
						con.c.write con.msg.shift(), 'binary'
			else if con.recon
				con.msg.push cmd
				if con.c.currently_reconnecting == null
					con.c.currently_reconnecting = true
					nc = net.createConnection con.port, con.host
					nc.setEncoding 'binary'
					nc.addListener 'connect', () =>
						@setEncoding 'binary'
						@setTimeout 0
						@setNoDelay()
						@addListener 'data', con.c.receiveListener
						con.c = @
						while con.msg.length > 0
							@write con.msg.shif(), 'binary'
			else console.log 'Error: readyState not defined'
	log : (info) ->
		console.log 'log', " - "+ info
	leg : (error) ->
		console.log " - Error: "+ error.toString().replace(/error:/i, '')

class mongous extends con

	constructor: (s) ->
		e = false
		if con.c is null then @open()
		if s.length >= 80
			console.log "Error: '" + s + "' - Database name and collection exceed 80 character limit."
			e = true
		p = s.search(/\./)
		if p <= 0
			console.log "Error: '" + s + "' - Database.collection nomenclature required"
			e = true
		@db = s.slice 0, p
		@col = s.substr p+1
		if @col.search(/\$/) >= 0
			if @col.search(/\$cmd/i) < 0
				console.log "Error: '" + s + "' - cannot use '$' unless for commands."
				e = true
			else 
				console.log "Error: '" + s + "' - silent."
				e = true
		else if @col.search(/^[a-z|\_]/i) < 0
			console.log "Error: '" + s + "' - Collection must start with a letter or an underscore."
			e = true
		if e 
			@db = '!'
			@col = '$'
		@
	
	open: () -> super
	
	send: (cmd,op,id) -> 
		if cmd.collectionName == '!.$'
			false
		else
			id or= @id()
			super com.binary(cmd,op,id)
	
	update: (a, b, c...) ->
		if !a or !b
			console.log "Query and document required."
		#to do: check namespaces
		if c[0] or c.length is 2
			if c[0] instanceof Object
				m = if c[0].multi then 1 else 0
				u = if c[0].upsert then 1 else 0
			else
				u = if c[0] then 1 else 0
				m = if c[1] then 1 else 0
		else m = u = 0
		cmd =
			collectionName: @db+'.'+@col
			flags: parseInt m.toString() + u.toString()
			spec: a
			document: b
		@send cmd, 2001
	
	find: (a...) ->
		if !a
			@leg "Callback required"
		obj = []
		num = []
		for i in a
			if i instanceof Function
				fn = i
			else if i instanceof Object
				obj.push i
			else if !isNaN(i)
				num.push i
		
		q = if obj[0] then obj[0] else {}
		f = if obj[1] then obj[1] else null
		o = if obj[2] then obj[2] else {}
		o =
			lim: if o.lim isnt undefined then o.lim else if num[0] then num[0]
			skip: if o.skip isnt undefined then o.skip else if num[1] then num[1] else 0
		cmd =
			collectionName: @db+'.'+@col
			numberToSkip: o.skip
			numberToReturn: o.lim
			query: q
			returnFieldSelector: f
		id = @id()
		con.c.addListener id.toString(), (msg) =>
			if fn then fn(msg)
			con.c.removeListener(id.toString(), con.c.listeners(id.toString())[0])
		@send cmd, 2004, id
		
	
	insert: (a...) ->
		docs = if a[0] instanceof Array then a[0] else a
		cmd =
			collectionName: @db+'.'+@col
			documents: docs
		@send cmd, 2002
		
	save: (a) ->
		@update a, a, 1
		
	log: (info) ->
		@emit 'log', " - "+ info
	leg: (error) ->
		@emit 'log', " - Error: "+ error.toString().replace(/error:/i, '')
	id: () -> Math.round(Math.exp(Math.random()*Math.log(100000)))

class db
	constructor: (s) ->
		return new mongous s