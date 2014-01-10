//On load...
$(document).ready(function(){ 
	initTabletop(); 
});

//...create instance of tabletop to slurp data from order form spreadsheet
function initTabletop() {
    tabletop = Tabletop.init({
    	key: '0AkfgEUsp5QrAdG50OWc0YjVnY3Q0eEF4b01DZHlQbUE', 
    	callback: showInfo, 
    	simpleSheet: false 
    });
};

//*****************************************
//MAIN FUNCTION (callback from Tabletop): 
function showInfo(data, tabletop) {	
	//initialize map
	 map = initMap();
	//parse paramaters from url constructed by routeMapper.html
		params = parseParams();
		numStops = params.numStops;
	//pull order data from spreadsheet
		orders = tabletop.models['payments'].elements;
	//initialize blank array of stop objects, make global variable
	stops = [];
	//construct stop objects from order data and map them
	for (var i=0; i < numStops; i++){
		var rowNum = params['stop' + i + 'rowNum'];
		console.log('rowNum = ' + rowNum);
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
		name: order.restaurantname, 
		address: order.address, 
		invoiceAmount: order.invoiceamount,
		totalOwed: order.totalowed,
		paymentType: order.paymenttype,
		rowNum: order.rowNumber
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
			if (i != 'rowNum'){
				contentStr +=  '<strong>' + i.charAt(0).toUpperCase() + i.slice(1) + ':</strong> ' + this.order[i] + '<br/>';				
			}
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
		return '../../../../img/icons/numbers/green_' + (i + 1) + '.png';
	}
};

function clearInfoWindows(stops, stopNum){
	for (var i=0; i<stops.length; i++){
		if (i !== stopNum){
			if (stops[i].map.infoWindow) stops[i].map.infoWindow.close();
		}
	}
};

