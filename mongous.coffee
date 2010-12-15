net = require('net')
bp = require('./bson/binary_parser').BinaryParser
ee  = require('events').EventEmitter
com = require('./commands').Commands
mr = require('./responses/mongo_reply').MongoReply
command = require('./commands').Commands

class con extends ee
	con.c = null
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
	
	open: (port, host, recon) ->
		con.port = if port then port else con.port
		con.host = if host then port else con.host
		con.recon = if recon then recon else con.recon
		con.c = net.createConnection con.port, con.host
		con.c.setEncoding 'binary'
		con.c.addListener 'connect', () ->
			console.log "connecting..."
			con.c.setEncoding 'binary'
			con.c.setTimeout 0
			con.c.setNoDelay()
			MasterCmd =
				op: 2004
				collectionName: 'mongous.$cmd'
				queryOptions: 16
				numberToSkip: 0
				numberToReturn: -1
				query: { ismaster: 1 }
				returnFieldSelector: null
			con.c.write( command.binary(MasterCmd), 'binary' )
		con.c.addListener 'error', (e) =>
			con.c.emit 'error', e
		con.c.addListener 'close', () =>
			con.c.emit 'close'
		con.c.addListener 'data', (res) ->
			if con.byt > 0 and con.som > 0
				bytr = con.som - con.byt
				if bytr > res.length
					con.b += res
					con.byt += res.length
				else
					con.b += res.substr 0, bytr
					console.log 'data 1'
					r = new mr(con.b)
					if r.responseFlag > 0
						console.log r
					con.b = ''
					con.byt = 0
					con.som = 0
				if bytr < res.length
					console.log 'data 0'
					console.log(res.substr bytr, res.length-bytr)
			else if con.bb.length > 0
				res = con.bb + res
				con.bb = ''
			if res.length > 4
				som = bp.toInt(res.substr 0, 4)
				if som > res.length
					con.b += res
					con.byt = res.length
					con.som = som
				else if som == res.length
					console.log 'data 2'
					r = new mr(res)
					if r.responseFlag > 0
						console.log r
					try
						if r.documents[0].ismaster
							con.s = true
							con.c.emit 'connected', con.s
							console.log 'emitted connected'
						else con.s = false
					catch e
						con.s = false
				else if som < res.length
					console.log 'data 3'
					r = new mr(res.substr 0, som)
					if r.responseFlag > 0
						console.log r
					console.log(res.substr som, res.length-som)
			else s.bb = res
		
	close: () ->
		if con.c then con.c.end()
		
	send: (cmd) ->
		console.log con.c
		try
			con.c.write cmd, 'binary'
		catch e
			if con.c._connecting
				console.log 'waiting to connect'
				con.msg.push cmd
				con.c.addListener 'connected', (v) =>
					console.log 'finished connecting!'
					if v
						while con.msg.length > 0
							console.log con.msg
							con.c.write con.msg.shift(), 'binary'
			if con.c.readyState != 'open' and con.recon
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
			else console.log 'readyState not defined'

class mongous extends con
	constructor: (s) ->
		if con.c is null then @open()
		if s.length >= 80
			console.log "Database name and collection exceed 80 character limit."
		p = s.search(/\./)
		if p <= 0
			console.log "Database.collection nomenclature required"
		@db = s.slice 0, p
		@col = s.substr p+1
		if @col.search(/\$/) >= 0
			if @col.search(/\$cmd/i) < 0
				console.log " cannot use '$' unless for commands."
			else console.log "silent."
		else if @col.search(/^[a-z|\_]/i) < 0
			console.log "Collection must start with a letter or an underscore."
		@
	
	open: () -> super
	
	send: (cmd) -> super com.binary(cmd)
	
	update: (a, b, c..., z) ->
		if !a or !b
			@leg "Query and document required."
		### to do: check namespaces ####
		if typeof z != 'function'
			c[0] = z
		if c[0]
			m = if c[0].multi then 1 else 0
			u = if c[0].upsert then 1 else 0
		else u = m = 0
		console.log 'FLAGS:' + parseInt m.toString() + u.toString()
		cmd =
			op: 2001
			collectionName: @db+'.'+@col
			flags: parseInt m.toString() + u.toString()
			spec: a
			document: b
		console.log cmd
		@send cmd
		
	query: (a) ->
		a = if a is null then {} else a
		cmd =
			op: 2004
			collectionName: @db+'.'+@col
			numberToSkip: 0
			numberToReturn: -1
			query: a
			returnFieldSelector: null
		@send cmd
	
	insert: (a) ->
		cmd =
			op: 2002
			collectionName: @db+'.'+@col
			documents: a
		@send cmd
		
	save: (a) ->
		console.log 'save'
		
	log : (info) ->
		@emit 'log', " - "+ info
	leg : (error) ->
		@emit 'log', " - Error: "+ error.toString().replace(/error:/i, '')

class db
	constructor: (s) ->
		return new mongous s
		
db('mongous.please').insert({bat: 'roar'})
db('mongous.please').update({bat: 'roar'}, {bat: 'squEEk'}, {upsert: 1})
db('mongous.please').query({bat: 'roar'})
db('mongous.please').query({bat: 'squEEk'})