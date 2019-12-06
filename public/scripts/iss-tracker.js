var map = null;
var issmarker;
var geolocationKey = "AIzaSyDH_crf80-s8-jMeVEzRCLcUNJysmyhzvU";
var geoCodeKey = "AIzaSyDH_crf80-s8-jMeVEzRCLcUNJysmyhzvU";

var issPath = [];
var userLocation = false;
var userLat, userLng;
var pathTrack;
var ta = -1;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: -34.397,
            lng: 150.644
        },
        zoom: 5,
        draggable: false
    });
    var icon = {
        url: "/images/iss-icon-map-overlay.png", // url
        scaledSize: new google.maps.Size(50, 50), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(25, 25) // anchor
    };

    issmarker = new google.maps.Marker({
        icon: icon,
        map: map,
        position: new google.maps.LatLng(-34.397, 150.644)
    });
}

function initTracker() {
    if(!map) initMap();
    setUserLocation();
    updateTracker();
    ta = setInterval(updateTracker, 5000);
}

function setUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            $('.your-location .your-lat').text(pos.lat);
            $('.your-location .your-lng').text(pos.lng);

            $.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${pos.lat},${pos.lng}&key=${geolocationKey}`, function (data) {
                userLat = pos.lat;
                userLng = pos.lng;
                userLocation = true;
            });
        });
        console.log('Geolocation is supported!');
      }
      else {
        console.log('Geolocation is not supported for this Browser/OS.');
      }
}

function updateTracker() {
    var getData = getIssData();
    getData.done(function (data, status, xhr) {

        var currLat = data.iss_position.latitude,
            currLng = data.iss_position.longitude;

        var center = new google.maps.LatLng(currLat, currLng);


        issmarker.setPosition(new google.maps.LatLng(currLat, currLng));

        if (userLocation) {
            var φ1 = toRadians(userLat),
            φ2 = toRadians(currLat),
            Δλ = toRadians(currLng - userLng),
            R = 6371; // gives d in metres
          var d = Math.acos(Math.sin(φ1) * Math.sin(φ2) + Math.cos(φ1) * Math.cos(φ2) * Math.cos(Δλ)) * R;
          $('.distance-value-m').text(d);
          $('.distance-value-mi').text(d * 0.000621);
        }

        var currentPosition = {
            lat: parseFloat(currLat),
            lng: parseFloat(currLng)
        };
        issPath.push(currentPosition);

        map.panTo(center);
        pathTrack = new google.maps.Polyline({
            path: issPath,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });

        pathTrack.setMap(map);

        $.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${currentPosition.lat},${currentPosition.lng}&key=${geolocationKey}`, function (data) {
            updateInfoPane(currentPosition, parseLocationObj(data));
        });

    });
    getData.fail(function (err) {
        console.log(err);
    });
}

function toRadians(degrees) {
    var pi = Math.PI;
    return degrees * (pi/180);
}

function parseLocationObj(locObj) {
    var newLocObj = {
        country: 'N/A',
        administrative_area_level_1: 'N/A',
        administrative_area_level_2: 'N/A',
        establishment: 'N/A'
    };
    if (locObj.status === "ZERO_RESULTS") {
        newLoc = {
            location: 'No associated location. Middle of nowhere.'
        };
        return newLocObj;
    }

    $.each(locObj.results[0].address_components, function (i, item) {
        switch (item.types[0]) {
            case 'establishment':
                newLocObj.establishment = item.long_name;
                break;
            case 'country':
                newLocObj.country = item.long_name;
                break;
            case 'administrative_area_level_1':
                newLocObj.administrative_area_level_1 = item.long_name;
                break;
            case 'administrative_area_level_2':
                newLocObj.administrative_area_level_2 = item.long_name;
                break;
        }
    });

    return newLocObj;
}

function updateInfoPane(location, locationDetails) {
    $('.iss-location .iss-lat').text(location.lat);
    $('.iss-location .iss-lng').text(location.lng);

    $('.iss-location .establishment-label > p').text(locationDetails.establishment);
    $('.iss-location .country-label > p').text(locationDetails.country);
    $('.iss-location .area_1-label > p').text(locationDetails.administrative_area_level_1);
    $('.iss-location .area_2-label > p').text(locationDetails.administrative_area_level_2);
}

function getIssData() {
    return $.ajax('https://ilbowman.com/astronomy-open-notify-json');
}