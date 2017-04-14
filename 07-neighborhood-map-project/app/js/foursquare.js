var Foursquare = (function() {
  const CLIENT_ID = "TYGMNFUJEMDGQ0TBOELKSDYCEWGZUVUUZWBSYGSAGRZDO2OF";
  const CLIENT_SECRET = "41X4YIXVVNZN3GDVJEF0VPVQMKQBMZM0FPHI5UNCGXNHMUAF"
  const SUPPORTED_VERSION = "20170409"

  // get opening hours for a venue based on its foursquare id
  function getVenueHours(id) {
    return _getVenueDetails('https://api.foursquare.com/v2/venues/' + id + '/hours', 1)
      .then(data => {
        var openingHours = [];
        if(data.response.hours && data.response.hours.timeframes) {
          for(var i = 0; i < data.response.hours.timeframes.length; i++) {
            var timeframe = data.response.hours.timeframes[i];
            for(var j = 0; j < timeframe.days.length; j++) {
              var fromUnformatted = timeframe.open[0].start;
              var toUnformatted = timeframe.open[0].end.startsWith("+") ? timeframe.open[0].end.substr(1) : timeframe.open[0].end;
              openingHours.push({
                "day" : _getDayString(timeframe.days[j]),
                "from" : [fromUnformatted.slice(0, 2), ":", fromUnformatted.slice(2)].join(''),
                "to" : [toUnformatted.slice(0, 2), ":", toUnformatted.slice(2)].join('')
              });
            }
          }
        }
        return openingHours;
      });
  }

  // returns an array of photo urls
  function getVenuePhotos(id, sizeString) {
    return _getVenueDetails('https://api.foursquare.com/v2/venues/' + id + '/photos', 1)
      .then(data => {
        console.log("raw photos: " + data);
        var urls = [];
        if(data.response.photos.count > 0) {
          for(var i = 0; i < data.response.photos.items.length; i++){
            var item = data.response.photos.items[i];
            urls.push(item.prefix + sizeString + item.suffix);
          }
        }
        return urls;
      });
  };

  function _openingHourString(arr) {
    var result = "";
    for(var i = 0; i < arr.length; i++) {
      var current = arr[i];
      var start = current.start;
      var end = current.end;
      result = result + "(" + current.start + " - " + current.end + ") ";
    }
    return result;
  }

  function _getDayString(id){
    var day;
    switch(id) {
      case 1:
        day = "Monday";
        break;
      case 2:
        day = "Tuesday";
        break;
      case 3:
        day = "Wednesday";
        break;
      case 4:
        day = "Thursday";
        break;
      case 5:
        day = "Friday";
        break;
      case 6:
        day = "Saturday";
        break;
      case 7:
        day = "Sunday";
        break;
      default:
        day = "unknown day";
    }
    return day;
  }

  function _getVenueDetails(fourSquarUrl, limit) {
    return new Promise(function (resolve, reject) {
      $.ajax({
        url: fourSquarUrl,
        type: 'GET',
        data: {
          'client_id': CLIENT_ID,
          'client_secret' : CLIENT_SECRET,
          'v': SUPPORTED_VERSION,
          'limit' : limit
        },
        dataType: 'json',
        success: resolve,
        error: reject,
        timeout: 5000
      });
    });

  }


  return {
    getVenueHours: getVenueHours,
    getVenuePhotos: getVenuePhotos
  };
})();