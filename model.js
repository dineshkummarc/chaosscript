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
    parseTreeByFiles: function( fileList ) {
        var result = {};
        fileList.forEach(function(f) {
            var path = f.name.split('/');
            for(var i = 0; i < path.length; i++) {
                result[path[i]] = (result[path[i]] || {});
                if (path.length > 1) { // Directory
                    result[path[i]]['type'] = 'directory';
                    result[path[i]]['files'] = (result[path[i]]['files'] || {});
                } else { // File
                    result[path[i]]['type'] = ['file'];
                }
            }
          });
        fileList

        return result;
    },

    getRecommendations: function(cb) {
        function walkRecommendations(infoHexes, results, cb) {
            if (infoHexes.length < 1)
                cb(null, results);
            else {
                var infoHex = infoHexes.shift();
                module.exports.getFileinfo(infoHex, function(error, fileinfo) {
                                               if (fileinfo)
                                                   results.push({ infoHex: infoHex,
                                                                  name: fileinfo.name || 'Torrent file'
                                                                });
                                               walkRecommendations(infoHexes, results, cb);
                                           });
            }
        }

        redis.get("recommendations", function(error, data) {
                      var infoHexes;
                      try {
                          infoHexes = JSON.parse(data.toString());
                      } catch (e) {
                          error = e.message;
                      }
                      if (error)
                          cb(error);
                      else if (infoHexes && infoHexes.shift) {
                          walkRecommendations(infoHexes, [], cb);
                      } else
                          cb(null, []);
                  });
    }
};
