/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
	initialize: function() {
		document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
	},

  onDeviceReady: function() {
		var addr = document.getElementById('addr');
		addr.addEventListener('keypress', userAddr);
		
    var btnCoord = document.getElementById('btnCoord');
		btnCoord.addEventListener('click', fetchUserAddr);

    var yourCoord = document.getElementById('yourCoord');
		yourCoord.addEventListener('click',fetchUserLocation);
  }
};

var map = null;
var geocoder = null;

function showMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 65.0120888, lng: 25.46507719996 },
    zoom: 13
  });
  geocoder = new google.maps.Geocoder();
}

function addMarkerToMap(position, map) {
  var marker = new google.maps.Marker({
    position: position,
    map: map
  });
}

function userAddr() {
    getLatLong();
}

function getAddrCoord(address) {
  return new Promise(function(resolve, reject) {
    geocoder.geocode({ address: address }, function(results, status) {
      if (status == 'OK') {resolve(results);}
			reject('Ouch, cant fetch the address coordinations');
    });
  });
}

function getUserCoord() {
  return new Promise(function(resolve, reject) {
		navigator.geolocation.getCurrentPosition(resolve, reject);
	});
}

function fetchUserLocation() {
  var userInfo = document.getElementById('userInfo');
  userInfo.innerHTML = 'Fetching your coordinations from google map!';
	
  getUserCoord().then(function(position) {
      var lat = position.coords.latitude;
      var lng = position.coords.longitude;
      var coordsInfo = {lat: lat, lng: lng};
			
      addMarkerToMap(coordsInfo, map);
      map.setCenter(coordsInfo);
      userInfo.innerHTML = 'Your Coordinations are: ' + lat + '°N, ' + lng + '°E';
    }).catch(function(err) {
      userInfo.innerHTML = 'Ouch, cant fetch your coordinations: ' + err.message;
    });
}

function fetchUserAddr() {
  var outputEl = document.getElementById('coordInfo');
  var addr = document.getElementById('addr');
  var address = addr.value;
	
  getAddrCoord(address).then(function(results) {
      addr.value = results[0].formatted_address;
      var location = results[0].geometry.location;
      var coordsInfo = {
        lat: location.lat(),
        lng: location.lng(),
      };
			
      outputEl.innerHTML =
        'Lat: ' + coordsInfo.lat + ', Long: ' + coordsInfo.lng;
      	addMarkerToMap(coordsInfo, map);
      	map.setCenter(coordsInfo);
    })
    .catch(function(err) {outputEl.innerHTML = err;});
}
app.initialize();
