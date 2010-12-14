net = require('net')
bp = require('./bson/binary_parser').BinaryParser
ee  = require('events').EventEmitter
com = require('./commands').Commands
mr = require('./responses/mongo_reply').MongoReply
command = require('./commands').Commands

class con extends ee
	con.c = null
	con.d = true
	con.msg = []
	con.ms = 0
	con.byt = 0
	con.b = ''
	con.bb = ''
	con.port = 27017
	con.host = 'localhost'
	con.recon = false
	
	open: (port, host, recon) ->
		con.port = if port then port else con.port
		con.host = if host then port else con.host
		con.recon = if recon then recon else con.recon
		con.c = net.createConnection con.port, con.host
		con.c.setEncoding 'binary'
		con.c.addListener 'connect', () =>
			@setEncoding 'binary'
			@setTimeout 0
			@setNoDelay()
			MasterCmd =
				collectionName: 'mongous.$cmd'
				queryOptions: 16
				numberToSkip: 0
				numberToReturn: -1
				query: { ismaster: 1 }
				returnFieldSelector: null
			con.send( command.query(MasterCmd) )
			con.c.emit 'connect'
		con.c.addListener 'error', (e) =>
			con.c.emit 'error', e
		con.c.addListener 'close', () =>
			con.c.emit 'close'
		con.receiveListener = (res) ->
			if con.byt > 0 and con.som > 0
				bytr = con.som - con.byt
				if bytr > res.length
					con.b += res
					con.byt += res.length
				else
					con.b += res.substr 0, bytr
					con.c.emit 'data', con.b
					con.b = ''
					con.byt = 0
					con.som = 0
				if bytr < res.length
					con.receiveListener(res.substr bytr, res.length - bytr)
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
					con.c.emit 'data', res
				else if som < res.length
					con.c.emit('data', res.substr 0, som)
					con.receiveListener(res.substr som, res.length - som)
			else s.bb = res
		con.c.addListener 'data', con.receiveListener
	
	close: () ->
		if con.c then con.c.end()
		
	send: (cmd) ->
		try
			con.c.write cmd, 'binary'
		catch e
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
						@addListener 'data', con.receiveListener
						con.c = @
						while con.msg.length > 0
							@write con.msg.shif(), 'binary'
			else throw e

class mongous extends con
	constructor: (s) ->
		if con.c is null then console.log @open() else con.c
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
	
	send: (cmd) -> super cmd
	
	update: (a, b, c..., z) ->
		if !a or !b
			@leg "Query and document required."
		### to do: check namespaces ####
		if c[0]
			m = if c[0].multi then 1 else 0
			u = if c[0].upsert then 1 else 0
		else u = m = 0
		cmd =
			op: 2001
			collectionName: @db+'.please'
			flags: parseInt m.toString() + u.toString()
			spec: a
			document: b
		@send cmd
	save: (a) ->
		@send 'save'
	log : (info) ->
		@emit 'log', " - "+ info
	leg : (error) ->
		@emit 'log', " - Error: "+ error.toString().replace(/error:/i, '')

class db
	constructor: (s) ->
		return new mongous s
		
db('mongous.testing').update({ cat: 'meow' }, { lion: 'roar'}, true, true)