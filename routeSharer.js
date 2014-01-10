
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
function showInfo(data, tabletop) {	
	//initialize map
	var map = initMap(),
	//parse paramaters from url constructed by routeMapper.html
		params = parseParams();
		numStops = params.numStops,
	//pull order data from spreadsheet
		orders = tabletop.models['Orders'].elements,
	//initialize blank array of stop objects
		stops = [];
	//construct stop objects from order data and map them
	for (var i=0; i < numStops; i++){
		var rowNum = params['stop' + i + 'rowNum'];
		stops.push(new Stop(map, orders[rowNum -2], i));
		stops[i]
			.setMarker()
			.setInfoWindow();
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

//STOP CONSTRUCTOR FUNCTION (does bulk of the work)
function Stop (map, order, i){
	
	that = this;
	
	this.stopNum = i;
	
	this.order = {
		name: order.name,
		address: order.streetnumber + ', ' + order.city + ', ' + order.state,
		apartment: order.apartment,
		phone: order.phone,
		csa: order.csa,
		shares: order.shares,
		deliveryWindow: order.deliverywindow,
		specialRequests: order.specialrequests,
		payment: order.payment,
		amountOwed: order.amountowed	
	};

	this.map = {
		map: map,
		lat: order.lat,
		lng: order.lng,
		marker : {}, //<-- set later with accessor method
		infoWindow: {} //<-- set later with accessor method
	};
	
	//creates stop markers on a pre-initialized google map (icon dependent on index)
	this.setMarker = function(){
		var gooGeo = new google.maps.LatLng(this.map.lat, this.map.lng);
		this.map.marker = new google.maps.Marker({
			map: this.map.map,
	    	position: gooGeo,
	    	title: this.order.address,
	    	icon: this.getIcon()
	    });
	    return this;
	};
	
	this.setInfoWindow = function(){
		var map = this.map,
			contentStr = '',
			that = this;
		for (var i in this.order){
			contentStr +=  '<strong>' + i.charAt(0).toUpperCase() + i.slice(1) + ':</strong> ' + this.order[i] + '<br/>';
		}
		map.infoWindow = new google.maps.InfoWindow({
			content: contentStr	
		});
		google.maps.event.addListener(map.marker, 'click', function() {
		    map.infoWindow.open(map.map, map.marker);
		    clearInfoWindows(stops, that.stopNum);
		});
		
		return this;
	}
	
	this.getIcon = function(){
		var window = this.order.deliveryWindow.slice(0,1), 
			colors = {
				'-': 'grey',
				'N': 'green',
				'7': 'yellow',
				'8': 'orange',
				'9': 'red',
				'1': 'pink' 
			};
		return'../../../img/icons/numbers/' + colors[window] + '_' + (i +1) + '.png';
	}
};

function clearInfoWindows(stops, stopNum){
	for (var i=0; i<stops.length; i++){
		if (i !== stopNum){
			if (stops[i].map.infoWindow) stops[i].map.infoWindow.close();
		}
	}
}

