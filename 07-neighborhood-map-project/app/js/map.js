var Map = (function() {
  "use strict";
  // the map object
  var googleMap;
  var markers = [];
  var defaultIcon;
  var hoveredIcon;
  var largeInfoWindow;

  // This function initializes the map view and centers the map on the initial location
  function init() {
    googleMap = new google.maps.Map(document.getElementById('map'), {
      zoom: 8,
      center: CONFIG.INITIAL_LOCATION
    });

    defaultIcon = makeMarkerIcon('0091ff');
    hoveredIcon = makeMarkerIcon('FFFF24');
    largeInfoWindow = new google.maps.InfoWindow();

    // make map display responsively
    google.maps.event.addDomListener(window, 'resize', function() {
      fitBounds();
    });
  }


  // This function adds an array of location markers to the map view.
  function addMarkers(locationItems) {

    for(var i = 0; i < locationItems.length; i++) {
      var currentItem = locationItems[i];
      var marker = new google.maps.Marker({
        position: currentItem.position,
        title: currentItem.name,
        icon: defaultIcon,
        animation: google.maps.Animation.DROP,
        locationItem: currentItem
      });

      // create an on click event to open an infowindow at each marker
      marker.addListener('click', function() {
        populateInfoWindow(this, largeInfoWindow);
      });

      marker.addListener('mouseover', function() {
        this.setIcon(hoveredIcon);
      });

      marker.addListener('mouseout', function() {
        this.setIcon(defaultIcon);
      });

      markers.push(marker);
    }

    // show on map
    setMapOnAll(googleMap);
  }

  // This function (adapted from the course material) populates the infowindow when the marker is clicked.
  function populateInfoWindow(marker, infoWindow) {
    // make sure the infowindow is not already opened on this marker
    if(infoWindow.marker != marker) {
      // marker bounces once when the infowindow is opened
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function(){ marker.setAnimation(null); }, 750);
      infoWindow.marker = marker;
      var foursquareId = marker.get("locationItem").foursquare.id;
      infoWindow.setContent("loading data from foursquare ...");
      // retrieve data from foursquare (asynchronously)
      Promise.all([Foursquare.getVenuePhotos(foursquareId, "150x150"), Foursquare.getVenueHours(foursquareId)])
        .then(data => {
          // set infowindow markup via Google Maps API
          infoWindow.setContent(getInfoWindowMarkup(data[0], data[1]));
        })
        .catch(error => {
          // at least one call failed
          infoWindow.setContent("failed to load data from foursquare: " + error.statusText);
        });

      // make sure the marker property is cleared when the window is closed
      infoWindow.addListener('closeclick', function() {
        infoWindow.marker = null;
      });

      infoWindow.open(googleMap, marker);

      // makes sure the infowindow is displayed in the visible area
      recenter(marker);
      googleMap.panBy(0,-200);
    }
  }

  // This function computes the dynamic markup of the infowindow
  function getInfoWindowMarkup(venuePhotos, venueHours) {
    // templated markup fragments
    var markupPhoto = '<div><img class="rounded-circle" alt="sample image" src="{url}"></div>';
    var markupOpeningHours = '<h5>Opening Hours</h5><table>{data}</table>';
    var markupOpeningHour = '<tr><td>{day}</td><td>{from}</td><td>{to}</td></tr>';
    var markupAttribution = '<p>Powered By <a href="https://foursquare.com/">Foursquare</a></p>';
    var markupDelimiter = "<hr>";
    var result = '';
    if(venuePhotos && venuePhotos.length > 0) {
      result += markupPhoto.replace("{url}", venuePhotos[0]); // future improvements: provide support for multiple image urls
    }
    if(venueHours && venueHours.length > 0) {
      result += markupDelimiter;
      var tmp = '';
      for (var i = 0; i < venueHours.length; i++) {
        tmp += markupOpeningHour.replace("{day}", venueHours[i].day).replace("{from}", venueHours[i].from).replace("{to}", venueHours[i].to);
      }
      result += markupOpeningHours.replace("{data}", tmp);
    }
    result += markupDelimiter + markupAttribution;
    return result;
  }

  // This function changes the visibility of location markers on the map. Only location markers
  // for the provided locations are set to visible.
  function filterMarkers(arr) {
    // close open infowindow (no-op if no infowindow is currently open)
    largeInfoWindow.close();

    // get names of locations to display
    var locationNames = arr.map(function(location){
      return location.name;
    });

    // loop over all markers, set them to visible if they are contained in the provided name array
    for(var i = 0; i < markers.length; i++){
      markers[i].setVisible(locationNames.includes(markers[i].title));
    }
  }

  // This function sets the map on all markers in the array.
  function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
    }
  }

  // This function recenters the map and makes sure that all markers fit in the view
  function fitBounds() {
    var bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    for (var i = 0; i < markers.length; i++) {
      if(markers[i].getVisible()) {
        bounds.extend(markers[i].position);
      }
    }
    googleMap.fitBounds(bounds);
  }

  // This function takes in a COLOR, and then creates a new marker icon of that color.
  // The icon will be 21 px wide by 34 high, have an origin of 0,0
  // and be anchored at 10,34.
  // (copied from course material)
  function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
      'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
      '|40|_|%E2%80%A2',
      new google.maps.Size(21, 34),
      new google.maps.Point(0, 0),
      new google.maps.Point(10, 34),
      new google.maps.Size(21, 34));
    return markerImage;
  }

  // This function recenters the map based on the provided location.
  function recenter(locationItem) {
    googleMap.setCenter(locationItem.position);
    // googleMap.setZoom(15);
  }

  function showInfoWindow(locationItem) {
    // find matching location
    var idx = markers.findIndex(function(marker){
      return marker.title == locationItem.name;
    });

    if(idx >= 0) {
      populateInfoWindow(markers[idx], largeInfoWindow);
    }
  }

  return {
    init: init,
    addMarkers: addMarkers,
    filterMarkers: filterMarkers,
    fitBounds: fitBounds,
    recenter: recenter,
    showInfoWindow: showInfoWindow
  };
})();