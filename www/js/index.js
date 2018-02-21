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
		
		var btnUserIntel = document.getElementById('btnUserIntel');
		btnUserIntel.addEventListener('click', sendIntel);
		
		var btnFetchIntel = document.getElementById('btnFetchIntel');
		btnFetchIntel.addEventListener('click', fetchIntel);
	}
};
var config = {
	apiKey: "AIzaSyDCMXtQ7wnVwYRugTLZl_V4jwhVkR47GZU",
	authDomain: "mobile-course-bi-1519048093039.firebaseapp.com",
	databaseURL: "https://mobile-course-bi-1519048093039.firebaseio.com",
	projectId: "mobile-course-bi-1519048093039",
	storageBucket: "mobile-course-bi-1519048093039.appspot.com",
	messagingSenderId: "99726208798"
};
firebase.initializeApp(config);
var database = firebase.database();

var pointA = null;
var pointB = null;
var userLat = null;
var userLng = null;

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
		userLat = lat;
		userLng = lng;
		
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
	
function sendIntel() {
	var userIntel = document.getElementById('userIntel').value;
	var intelSentStat = document.getElementById('intelSentStat');
	
	firebase.database().ref('/intel').push({
		lat: userLat,
		lng: userLng,
		userIntel : userIntel
	}).then(function(){
		intelSentStat.innerHTML = 'Thanks for helping to update our databse';
	}).catch(function(err) {
		intelSentStat.innerHTML = 'We had problem updating database: ' + err.message;
	});
}

function fetchIntel() {
	var showIntel = document.getElementById('showIntel');
	
	var infowindow = new google.maps.InfoWindow;
	 var marker, i;
	
	database.ref('/intel').once('value', function(snapshot){
		if(snapshot.exists()){
			var content = '';
			content += '<tr>';
			content += '<th>User Intel:</th>';
			content +=  '<th>Latitude:</th> ';
			content +=  '<th>Longitude:</th>';
			content +=	'</tr>';
			snapshot.forEach(function(data){
				var val = data.val();
				content +='<tr>';
				content += '<td>' + val.userIntel + '</td>';
				content += '<td>' + val.lat + '</td>';
				content += '<td>' + val.lng + '</td>';
				content += '</tr>';
			});
			
			snapshot.forEach(function(data){
				var val = data.val();
				marker = new google.maps.Marker({
						 position: new google.maps.LatLng(val.lat, val.lng),
						 map: map
				});
				google.maps.event.addListener(marker, 'click', (function(marker, i) {
						 return function() {
								 infowindow.setContent(val.userIntel);
								 infowindow.open(map, marker);
						 }
				})(marker, i));
			});
			
			showIntel.innerHTML = content;
	
		}
	});
}

app.initialize();
