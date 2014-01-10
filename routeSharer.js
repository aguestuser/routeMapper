
//for use with routeMapper.js

//On load...
$(document).ready(function(){ 
	initTabletop(); 
});

//...create instance of tabletop to slurp data from order form spreadsheet
function initTabletop() {
    tabletop = Tabletop.init({
    	key: '0AnpExRcGz7ZndHpHM1VuVWVsUVFMMmxwOGM1WWdPN3c', 
    	callback: showInfo, 
    	simpleSheet: false 
    });
};

//*****************************************
//MAIN FUNCTION (callback from Tabletop): 
function showInfo(tabletop) {	
	//initialize map
	var	map = initMap(),
	//parse paramaters from url constructed by routeMapper.html
		params = parseParams(),
		numStops = params.numStops,
	//store data from Orders model as array of dropoff objects
		dropoffs = tabletop['Orders'].elements,
	//filter data from Pickups model for all csas specified in dropoffs and store them as arry of pickup objects 
		pickups = tabletop['Pickups'].elements;
	
	//create blank global array to hold stop objects
	this.stops = [];
	showInfo = this;

	//loop through stop numbers specified in params
	for (var i=0; i < numStops; i++){
		//determine if each stop is a pickup or dropoff, and pass data from appropriate model to stop mapping function
		params['stop' + i + 'type'] == 'pickup'? 
			mapStop(pickups[params['stop' + i + 'id']], 'pickup', i) :
			mapStop(dropoffs[params['stop' + i + 'id']], 'dropoff', i);
	}
};
//******************************************

//initialize map
function initMap(){
	var gooGeo = new google.maps.LatLng(40.674799, -73.954362),
		mapOptions = {
			center: gooGeo,
			zoom: 13,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
	return new google.maps.Map(document.getElementById('map-canvas'), mapOptions);			
};

//parse variables from URL 
function parseParams(){
	var oGetVars = {};

	function buildValue(sValue) {
	  if (/^\s*$/.test(sValue)) { return null; }
	  if (/^(true|false)$/i.test(sValue)) { return sValue.toLowerCase() === "true"; }
	  if (isFinite(sValue)) { return parseFloat(sValue); }
	  if (isFinite(Date.parse(sValue))) { return new Date(sValue); }
	  return sValue;
	}
	
	if (window.location.search.length > 1) {
	  for (var aItKey, nKeyId = 0, aCouples = window.location.search.substr(1).split("&"); nKeyId < aCouples.length; nKeyId++) {
	    aItKey = aCouples[nKeyId].split("=");
	    oGetVars[unescape(aItKey[0])] = aItKey.length > 1 ? buildValue(unescape(aItKey[1])) : null;
	  }
	}
	return oGetVars;
};

//construct stop objects and map them	
function mapStop(node, type, index){
	showInfo.stops.push(new Stop(map, node, type, index));
	showInfo.stops[i]
		.setMarker()
		.setInfoWindow();
};

//STOP CONSTRUCTOR FUNCTION (does bulk of the work)
function Stop (map, node, type, index){
	
	this.index = index;
	this.type = type;
	
	if (this.type == 'dropoff'){
		//clone order data from spreadsheet
		this.data = {
			name: node.name, 
			address: node.streetnumber + ', ' + node.city + ', ' + node.state, 
			apartment: node.apartment,
			phone: node.phone,
			csa: node.csa,
			shares: node.shares,
			deliveryWindow: node.deliverywindow,
			specialRequests: node.specialrequests,
			payment: node.payment, 
			amountOwed: node.amountowed
		};
	} else if (this.type == 'pickup'){
		this.data = {
			name: node.name,
			address: node.address
		}
	}

	this.map = {
		map: map,
		lat: node.lat,
		lng: node.lng,
		marker : {}, //<-- set later with accessor method
		infoWindow: {} //<-- set later with accessor method
	};
	
	//creates stop markers on a pre-initialized google map (icon dependent on index)
	this.setMarker = function(){
		var gooGeo = new google.maps.LatLng(this.map.lat, this.map.lng);
		this.map.marker = new google.maps.Marker({
			map: this.map.map,
	    	position: gooGeo,
	    	title: this.data.address,
	    	icon: this.getIcon()
	    });
	    return this;
	};
	
	this.setInfoWindow = function(){
		var map = this.map,
			contentStr = '',
			that = this;
		for (var i in this.data){
			contentStr +=  '<strong>' + i.charAt(0).toUpperCase() + i.slice(1) + ':</strong> ' + this.data[i] + '<br/>';
		}
		map.infoWindow = new google.maps.InfoWindow({
			content: contentStr	
		});
		google.maps.event.addListener(map.marker, 'click', function() {
		    map.infoWindow.open(map.map, map.marker);
		    clearInfoWindows(showInfo.stops, that.index);
		});
		
		return this;
	}
	
	this.getIcon = function(){
		if (this.type == 'dropoff'){
			var window = this.data.deliveryWindow.slice(0,1), 
				colors = {
				'-': 'grey',
				'N': 'green',
				'7': 'yellow',
				'8': 'orange',
				'9': 'red',
				'1': 'pink' 
			};
			return'../../../img/icons/numbers/' + colors[window] + '_' + this.index + '.png';	
		} else if (this.type == 'pickup') {
			return'../../../img/icons/numbers/grey_' + this.index + '.png';
		}
	};
};

function clearInfoWindows(stops, index){
	for (var i=0; i<stops.length; i++){
		if (i !== index){
			if (stops[i].map.infoWindow) stops[i].map.infoWindow.close();
		}
	}
}

