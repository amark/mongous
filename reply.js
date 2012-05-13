var mr = require('./responses/mongo_reply').MongoReply;
module.exports = (function(con,res){
	if(con.c.br > 0 && con.c.som > 0){
		var rb = con.c.som - con.c.br;
		if(rb > res.length) {
			var b = new Buffer(con.c.b.length + res.length);
			con.c.b.copy(b, 0,0, con.c.b.length);
			res.copy(b, con.c.b.length,0, res.length);
			con.c.b = b;
			con.c.br = con.c.br + res.length
		} else {
			var b = new Buffer(con.c.b.length + res.length);
			con.c.b.copy(b, 0,0, con.c.b.length);
			res.copy(b, con.c.b.length,0, rb);
			var r = new mr(b);
			con.c.emit(r.responseTo.toString(),r);
			con.c.b = new Buffer(0);
			con.c.br = 0;
			con.c.som = 0;
			if(rb < res.length){
				con.r(res.slice(rb, res.length));
			}
		}
	} else {
		if(con.c.sb.length > 0){
			var b = new Buffer(con.c.sb.length + res.length);
			con.c.sb.copy(b, 0,0, con.c.sb.length);
			res.copy(b, con.c.sb.length,0, res.length);
			res = b;
			con.c.sb = new Buffer(0);
		}
		if(res.length > 4){
			var som = bu.decodeUInt32(res, 0);
			if(som > res.length){
				var b = new Buffer(con.c.b.length + res.length);
				con.c.b.copy(b, 0,0, con.c.b.length);
				res.copy(b, con.c.b.length,0, res.length);
				con.c.b = b;
				con.c.br = res.length;
				con.c.som = som;
			} else if(som <= res.length){
				var r = new mr(res.slice(0,som));
				if(con.s){
					var rts = r.responseTo.toString();
					if(con.reply[rts]){
						con.reply[rts](r);
					} else {
						con.c.emit(rts,r);
					}
				} else {
					if(r.documents.length && r.documents[0].ismaster){
						con.s = true;
						console.log("connected!");
						con.c.emit('connected',con.s);
						if(con.ccc) con.ccc(con.c);
					} else {
						con.s = false;
					}
				}
				if(som < res.length) {
					con.r(res.slice(som,res.length));
				}
			}
		} else {
			con.c.sb = res;
		}
	}
});