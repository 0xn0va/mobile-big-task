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
		// Main Initialization				
		var btnCoord = document.getElementById('btnCoord');
		btnCoord.addEventListener('click', fetchUserAddr);
		
		var yourCoord = document.getElementById('yourCoord');
		yourCoord.addEventListener('click',fetchUserLocation);
		
		var btnDistance = document.getElementById('btnDistance');
		btnDistance.addEventListener('click', calcDist);
	}
};

var pointA = null;
var pointB = null;

// Init google map callback
function showMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: { lat: 65.012, lng: 25.465 },
		zoom: 10
	});
	geocoder = new google.maps.Geocoder();
}

function addMarkerToMap(position, map) {
	var marker = new google.maps.Marker({
		position: position,
		map : map
	});
}

function getAddrCoord(address) {
	return new Promise(function(resolve, reject) {
		geocoder.geocode({ address: address }, function(results, status) {
			if (status == 'OK') {resolve(results);}
			reject('Ouch, cant fetch the address coordinations');
		});
	});
}

// User location from GPS
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
		
		pointA = new google.maps.LatLng(lat,lng);
		
		addMarkerToMap(coordsInfo, map);
		map.setCenter(coordsInfo);
		userInfo.innerHTML = 'Your Coordinations are: ' + lat + '°N, ' + lng + '°E';
	}).catch(function(err) {
		userInfo.innerHTML = 'Ouch, cant fetch your coordinations: ' + err.message;
	});
}

function fetchUserAddr() {
	var addr = document.getElementById('addr');
	var address = addr.value;
	var coordInfo = document.getElementById('coordInfo');
	
	
	getAddrCoord(address).then(function(results) {
		addr.value = results[0].formatted_address;
		var location = results[0].geometry.location;
		var coordsInfo = {
			lat: location.lat(),
			lng: location.lng(),
		};
		
		pointB = new google.maps.LatLng(
			coordsInfo.lat,
			coordsInfo.lng
		);
		
		coordInfo.innerHTML =
		'Lat: ' + coordsInfo.lat + ', Long: ' + coordsInfo.lng;
		addMarkerToMap(coordsInfo, map);
		map.setCenter(coordsInfo);
	})
	.catch(function(err) {coordInfo.innerHTML = err;});
}

function calcDist() {
	var distKm = document.getElementById('distKm');
	var showTime = document.getElementById('showTime');
	var showRoute = document.getElementById('showRoute');

	var dist = google.maps.geometry.spherical.computeDistanceBetween(pointA,pointB);
	distance = (dist/1000).toFixed(2) + 'km';
	distKm.innerHTML = distance;
		
	var directionsService = new google.maps.DirectionsService();
	directionsService.route(
		{
			origin: pointA,
			destination: pointB,
			travelMode: google.maps.DirectionsTravelMode.DRIVING,
			unitSystem: google.maps.UnitSystem.METRIC
		},
		function(response, status) {
			if (status === google.maps.DirectionsStatus.OK) {
				timeofTravel = response.routes[0].legs[0].duration.text;
				stepsofTravel = response.routes[0].legs[0].steps.map(function(step) {
					return {
						distance: step.distance.text,
						duration: step.duration.text,
						instructions: step.instructions
					};});		
							
				var directionsRenderer = new google.maps.DirectionsRenderer({map: map, directions: response });
				showTime.innerHTML = timeofTravel;
				
				var routeList = [];
				for (var i = 0; i < stepsofTravel.length; i++) {
						routeList.push(stepsofTravel[i].instructions);
						routeList.push('<br />')
				}
				showRoute.innerHTML = routeList;
			} else {
					console.log('Ouch');
			}
		}
	);
}

app.initialize();
