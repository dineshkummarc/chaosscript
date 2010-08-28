var RedisClient = require('redis-client-0.3.5');
var redis = RedisClient.createClient();
redis.select(1);

module.exports = {
    putTrackers: function(infoHex, urls, cb) {
	if (urls.length == 0) {
	    cb();
	} else {
	    var url = urls.pop();
	    module.exports.putTracker(infoHex, url, function(error) {
					  if (error)
					      cb(error);
					  else
					      module.exports.putTrackers(infoHex, urls, cb);
				      });
	}
    },

    putTracker: function(infoHex, url, cb) {
	redis.sadd("t:" + infoHex, url, cb);
    },

    getTrackers: function(infoHex, cb) {
	redis.smembers("t:" + infoHex, function(error, urls) {
			   if (error)
			       cb(error);
			   else if (!urls)
			       cb('Not found');
			   else
			       cb(null, urls);
		       });
    },

    putFileinfo: function(infoHex, list, cb) {
	var data = JSON.stringify(list);
	redis.set("f:" + infoHex, data, cb);
    },

    getFileinfo: function(infoHex, cb) {
	redis.get("f:" + infoHex, function(error, data) {
		      if (error)
			  cb(error);
		      else if (!data)
			  cb('Not found');
		      else {
			  var list = JSON.parse(data.toString());
			  cb(null, list);
		      }
		  });
    },
    getAllTorrents: function(cb) {
      redis.srandmember('1', function(error, torrents) {
        if (error)
            cb(error)
        else if (!torrents)
            cb('No torrents available');
        else
            cb(null, torrents);
      });
      return '';
    }
};
