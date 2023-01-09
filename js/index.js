var url = 'https://sea-route-server.azurewebsites.net/';
var path = [];
var markers = [];
var from = null;
var to = null;
var geocoding = false;
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
	// Valid geocodes
	if (from && to) {
		geocoding = false;
	}
	
	if (geocoding) {
		setTimeout(waitForGeocodes, 100);	
	} else if (from && to) {
		fetchSeaRoute();
	} else {
		stopSearch();
	}	
}

function fetchSeaRoute() {
	fetch(url, {
		method: 'POST',
		body: JSON.stringify({
			units: document.getElementById('ddlUnits').value,
			origin: from.position,
			destination: to.position
		}),
		headers: {
			'Content-type': 'application/json; charset=UTF-8',
		},
	})
	.then((response) => response.json())
	.then((json) => {
		drawRoute(json);
		stopSearch();		
	});		
}

function drawRoute(route) {
	// No Sea Route
	if (route == null) {
		console.log('Sea Route Not Found!');
		alert('Sea Route Not Found!\n' +
		 'Try another Sea Port!');
		return;
	} 
	
	path = [];	 
	console.log('Sea Route:');
	console.log(JSON.stringify(route));	
	var output = document.getElementById('output');
	var coordinates = route.geometry.coordinates;
	var bounds = new google.maps.LatLngBounds();
		
	// Display distance
	output.innerText = 'Distance is: ' + 
		route.properties.length.toFixed(2) +
		' ' + route.properties.units;
	
	// Set path and bounds
	for (i = 0; i < coordinates.length; i++) {
		var coordinate = coordinates[i];
		path.push({
			lat: coordinate[1],
			lng: coordinate[0]
		});
		bounds.extend({
			lat: coordinate[1],
			lng: coordinate[0]
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
	// Add markers to start and end of polyline
	createMarker(path[0], from.address);
	createMarker(path[path.length - 1], to.address);	
}

function startSearch() {
	to = null;
	from = null;
	geocoding = true;
	
	// Remove polyline
	if (polyline != null) {
		polyline.setMap(null);
	}	
	
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

			from = {
				address: address,
				position: results[0].geometry.location
			};
			
			console.log('From:');
			console.log(JSON.stringify(from));
		} else {
			geocoding = false;
			alert('Failed to geocode from address \n' + 
				address + ' reason ' + status);
		}
	});
}

function geoCodeTo(address) {
	geocoder.geocode({'address': address}, function(results, status) {
		if (status == 'OK') {
			//console.log(JSON.stringify(results));
			
			to = {
				address: address,
				position: results[0].geometry.location
			};

			console.log('To:');
			console.log(JSON.stringify(to));
		} else {
			geocoding = false;
			alert('Failed to geocode to address \n' + 
				address + ' reason ' + status);
		}
	});
}