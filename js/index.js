var path = [];
var markers = [];
var from = null;
var to = null;
var geocoder = null;
var polyline = null;
var map = null;

function initMap() {
	var div = document.getElementById('map');
	// Set Geocoder and Map
	geocoder = new google.maps.Geocoder();
	map = new google.maps.Map(div, getMapOptions());
	// Hide loading spinner
	hide('loader');
	// Get inputs
	var from = document.getElementById('txtFrom');
	var to = document.getElementById('txtTo');
	// Set defaults
	from.value = 'Rotterdam';
	to.value = 'Shanghai';
	// Enable Google Places Autocomplete 
	fromAutoComplete = new google.maps.places.Autocomplete(from);
	toAutoComplete = new google.maps.places.Autocomplete(to);
}

function createMarker(position, address) {
	// Create marker
	const marker = new google.maps.Marker({
		position: position,
		map: map
	});
	// Create info window
	const infowindow = new google.maps.InfoWindow({
		content: "<p>" + address + "</p>",
	});
	// Add marker click event handler
	google.maps.event.addListener(marker, "click", () => {
		infowindow.open(map, marker);
	});
	// Add marker
	addMarker(marker);
}

// Add marker to array
function addMarker(marker) {
	markers.push(marker);
}

// Set map on all markers
function setMapOnAll(map) {
	for (let i = 0; i < markers.length; i++) {
		markers[i].setMap(map);
	}
}

// Hide all markers
function hideMarkers() {
	setMapOnAll(null);
}

// Show all markers
function showMarkers() {
	setMapOnAll(map);
}

// Delete all markers
function deleteMarkers() {
	hideMarkers();
	markers = [];
}

function getMapOptions() {
	return {
		center: {
			lat: 0,
			lng: 0
		},
		zoom: 3
	};
}

function onSearch() {
	var txtFrom = document.getElementById('txtFrom');
	var txtTo = document.getElementById('txtTo');

	if (txtFrom.value && txtTo.value) {
		startSearch();
		geoCodeFrom(txtFrom.value);
		geoCodeTo(txtTo.value);
		waitForGeocodes();
	} else {
		alert('From and To fields are required.');
	}
}

function waitForGeocodes() {
	if (from && to) {
		fetchSeaRoute();
	} else {
		setTimeout(waitForGeocodes, 100);		
	}
}

function fetchSeaRoute() {
	fetch('https://sea-route-server.azurewebsites.net/', {
		method: 'POST',
		body: JSON.stringify({
			units: document.getElementById('ddlUnits').value,
			origin: from.gps,
			destination: to.gps
		}),
		headers: {
			'Content-type': 'application/json; charset=UTF-8',
		},
	})
	.then((response) => response.json())
	.then((json) => {
		//console.log(JSON.stringify(json));
		drawRoute(json);
		stopSearch();		
	});		
}

function drawRoute(route) {
	
	if (route == null) {
		alert('Sea Route Not Found!\n' +
		 'Try a larger Sea Port!');
		return;
	}
	
	path = [];	 
	var output = document.getElementById('output');
	var coordinates = route.geometry.coordinates;
	var bounds = new google.maps.LatLngBounds();
	
	// Remove old polyline
	if (polyline != null) {
		polyline.setMap(null);
	}
	
	// Display distance
	output.innerText = 'Distance is: ' + 
		route.properties.length.toFixed(2) +
		' ' + route.properties.units;
	
	// Set path and bounds
	for (i = 0; i < coordinates.length; i++) {
		var gps = coordinates[i];
		path.push({
			lat: gps[1],
			lng: gps[0]
		});
		bounds.extend({
			lat: gps[1],
			lng: gps[0]
		});
	}
	addMarkers();
	// Set polyline
	polyline = new google.maps.Polyline({
		path: path,
		strokeColor: '#0000FF',
		strokeOpacity: 0.5,
		strokeWeight: 5,
	});	
	// Draw polyline
	polyline.setMap(map);
	// Zoom to bounds
	map.fitBounds(bounds);	
}

function addMarkers() {
	createMarker(path[0], from.address);
	createMarker(path[path.length - 1], to.address);	
}

function startSearch() {
	to = null;
	from = null;
	deleteMarkers();
	show('loader');
	disable('btnSearch');
}

function stopSearch() {
	hide('loader');
	enable('btnSearch');
}

function enable(id) {
	document.getElementById(id).removeAttribute('disabled');
}

function disable(id) {
	document.getElementById(id).setAttribute('disabled', '');
}

function show(id) {
	document.getElementById(id).style.visibility = 'visible';
}

function hide(id) {
	document.getElementById(id).style.visibility = 'hidden';
}

function geoCodeFrom(address) {
	geocoder.geocode({'address': address}, function(results, status) {
		if (status == 'OK') {
			//console.log(JSON.stringify(results));
			var position = results[0].geometry.location;
			//console.log(JSON.stringify(position));
			from = {
				address: address,
				gps: position
			};
		} else {
			alert('Failed to geocode address reason: ' + status);
		}
	});
}

function geoCodeTo(address) {
	geocoder.geocode({'address': address}, function(results, status) {
		if (status == 'OK') {
			//console.log(JSON.stringify(results));
			var position = results[0].geometry.location;
			//console.log(JSON.stringify(position));
			to = {
				address: address,
				gps: position
			};
		} else {
			alert('Failed to geocode address reason: ' + status);
		}
	});
}