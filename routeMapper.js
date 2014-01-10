console.log('syncing works!')

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
	this.tabletop = tabletop;
	callback = this;
	map = initMap();

	$('#pick-date').click(function(){

		//store datepicker value
			date = $('#date').val();
		//filter all orders from spreadsheet matching datepicker date and store them as dropoffs
			dropoffs = filterOrders(callback.tabletop['Orders'].elements, date);
		//filter all csas specified in dropoffs and store them as pickups 
			pickups = getActivePickups(callback.tabletop['Pickups'].elements, dropoffs);

		//construct stop objects or replace them if they already exist
		stops = typeof(stops) == 'undefined' ? 
			mapStops(map, pickups, dropoffs) : 
			remapStops(map, pickups, dropoffs);
		
		//on click, retrieve a bit.ly permalink for the map
		$('#url-button').click(function(){
			getUrl(stops);
		});

	});	
};
//******************************************

//initialize map centered on Crown Heights Farm Share
function initMap() {
	var map = L.map('map-canvas', {
		center: [40.674799, -73.954362],
		zoom: 13
	});
	L.tileLayer('http://{s}.tile.cloudmade.com/a709cb849b29495cb18f11b31675dfd1/997/256/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
        maxZoom: 18
    }).addTo(map);
    return map;
};

function filterOrders(orders, date){
	var tempOrders = [],
		filter = new Date(date),
		feeds = [];
	for (var i = 0; i <orders.length; i++){
		feeds[i] = new Date(formatDate(orders[i].date));
		if (feeds[i].getYear() == filter.getYear() && feeds[i].getMonth() == filter.getMonth() && feeds[i].getDate() == filter.getDate()){
			tempOrders.push(orders[i]);
		}
	}
	return tempOrders;
};

function formatDate(date){
	Array.prototype.swap=function(a, b) {
	    this[a]= this.splice(b, 1, this[a])[0];
	    return this;
	}
	//translate 
	return date
			.split('/')
			.reverse()
			.swap(1,2)
			.join('-')
			.replace(/-[0-9](-|\b)/g, function(match){
				return '-0' + match.substr(1);
			});
};

function getActivePickups(pickups, dropoffs){
	var activePickups = [];
	//loop pickup objects
	for (var i = 0; i < pickups.length; i++){
		//loop  through dropoff objects
		for (var j = 0; j < dropoffs.length; j++){
			//if order contains csa name set csa.hasOrders to true and stop looping through orders, resume looping through csas
			if (pickups[i].name == dropoffs[j].csa){
				activePickups.push(pickups[i]);
				break;
			}
		}				
	}
	return activePickups;
};

// Stores spreadsheet data in variables, creates array of stop objects for use in mapping
function mapStops(map, pickups, dropoffs){

	//concatenate a temp array of pickups and dropoffs and a blank array for formated stop objects
		var protoStops = pickups.concat(dropoffs),
		stops = [];

	//construct stop objects
	for (var i = 0; i < protoStops.length; i++){
		if (i < pickups.length){
			protoStops[i]['type'] = 'pickup';
		} else {
			protoStops[i]['type'] = 'dropoff';
		}
		stops.push(new Stop(protoStops[i], i, map));
		stops[i]
			.setMarker()
			.appendLabel()
			.enableSwap();
	}
	appendUrlGetter();	
	return stops;
};

//replace stop objects (when mapping stops for a secod time on same page)
function remapStops(map, pickups, dropoffs){
	$('#stops').empty();
	$('#url-wrapper').remove();
	for (var i = 0; i < stops.length; i++){
		stops[i].map.popup.setMap(null);
		stops[i].map.marker.setMap(null);
		delete stops[i];	
	}
	return mapStops(map, pickups, dropoffs);
};


//*****************************************************
//*STOP CONSTRUCTOR FUNCTION (does the bulk of the work)
function Stop(node, index, map) {	

	//PROPERTIES
	
	//set reference variable for closures
	that = this;
	//store the node's stop type
	this.type = node.type;
	//store the stop's index value
	this.index = index;
	//set spacing unit for labels based off routeMapper.html's css	
	this.spacingUnit = 32;

	
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
			amountOwed: node.amountowed,
			id: node.id
		};
	} else if (this.type == 'pickup'){
		this.data = {
			name: node.name,
			address: node.address,
			id: node.id
		}
	}

	//store initialized map and stop's geocode; leave space for creating its marker and info window
	this.map = {
		map: map,
		lat: node.lat,
		lng: node.lng,
		marker : {}, //<-- set later with accessor method
		popup: {} //<-- set later with accessor method
	};

	//METHODS
	
	//retrieve stop's index
	this.getIndex = function(){
		return this.index;
	};

	//change stop's index -- for use when swapping order of stops (will trigger changes in icon, label, and marker)	
	this.setIndex = function(newIndex){
		this.index = newIndex;
		return this;
	};	
	
	//retrieve stop's icon (dependent on index)
	this.getIconUrl = function() {
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
	
	//retrieve stop's label (dependent on index)
	this.getLabel = function(){
		return '<div class="stop-container" id="stop-container' + this.index + '" style="top: ' + this.index*this.spacingUnit + '"><div class="stop-wrapper" id="stop-wrapper' + this.index + '"><img class ="stop-icon" id="stop-icon' + this.index + '"src="' + this.getIconUrl() + '"/><div class="stop-text">' + this.data.address + '</div></div></div>';		
	};

	//adds stop labels to DOM according to specifications in stop.label
	this.appendLabel = function() {
		$('#stops').append(this.getLabel());
		return this;
	};
	
	//replaces label elements in DOM after index has been changed 
	this.replaceLabel = function(){
		$('#stop-container' + this.index).replaceWith(this.getLabel());
		return this;		
	};
	
	//creates stop markers on a pre-initialized google map (icon dependent on index)
	this.setMarker = function(){
		this.map.marker = L.marker([this.map.lat, this.map.lng], {
			title: this.data.address,
			clickable: true,
			icon: L.icon({
				iconUrl: this.getIconUrl()
			})
		})
			.addTo(this.map.map)
			.bindPopup(this.getPopUpStr())
			.openPopup;

	    return this;
	};
	
	this.replaceMarker = function(){
		this.map.marker.setIcon(this.getIconUrl());
		return this;
	};
	
	this.getPopUpStr = function(){
		var contentStr = '';
				for (var i in this.data){
			contentStr +=  '<strong>' + i.charAt(0).toUpperCase() + i.slice(1) + ':</strong> ' + this.data[i] + '<br/>';
		}
		return contentStr;
	};

	/*
	this.setPopup = function(){
		var map = this.map,
			contentStr = '';
		for (var i in this.data){
			contentStr +=  '<strong>' + i.charAt(0).toUpperCase() + i.slice(1) + ':</strong> ' + this.data[i] + '<br/>';
		}
		map.popup = L.popup()
			.setLatLng(L.latLng(this.map.lat, this.map.lng))
			.setContent(contentStr)
			.openOn(map);
		
		return this;
	}	
	*/
	this.enableSwap = function(){
		enableSwap(this);
	};
	return this;
}; 

/*
function clearpopups(stops, index){
	for (var i=0; i<stops.length; i++){
		if (i !== index)
		stops[i].map.popup.close();
	}
}
*/

function enableSwap(stop){ // <-- make this a method of Stop()?
	
	// make route elements draggable
	$('#stop-wrapper' + stop.index).draggable({
		snap: '.stop-container', 
		snapMode: 'inner', 
		stack: '.stop-wrapper',
		// once element is done being dragged, do a lot of magic (!!!)
		stop: function(){ 

			//use the id of the dragged wrapper to retrieve its stop's original index
			oldIndex = parseInt($(this).attr('id').replace('stop-wrapper', ''));
			//caculate how many units the wrapper has been dragged
			unitsShifted = (parseInt($(this).css('top').replace('px', '')) / stop.spacingUnit);
			//generate the new index to be assigned to the wrapper's stop, corresponding to its new location
			newIndex = oldIndex + unitsShifted;
			//store the dragged stop in a temp var
			movedStop = stops[oldIndex];
			//create a temp array for stops displaced in shuffling
			tempStops=[];
			
			//store the direction that the stop was dragged ('down' for an increase in index and top value, 'up' for a decrease) 
			unitsShifted > 0 ? dir = 'down' : dir = 'up';
			
			//set paramaters for loops to reformat each stop object and reassign its position in the stops array from tempStops
			var pickLoop = {
				reformat: { 
					//loop will start at the displaced stop that has the lowest index (or top position that is furthest 'up') -- will not include dragged stop
					start: {down: oldIndex + 1, up: newIndex},
					//loop will end at the displaced stop that has the highest index (or top position that is furthest 'down') -- will not include dragged stop
					end: {down: newIndex, up: oldIndex - 1},
					//reformating function will move displaced stops one index in the opposite direction that the dragged stop was dragged
					shift: {down: -1, up: 1}
				},
				reassign: {
					//loop will start at the already-reformated stop with the lowest index (furthest 'up') -- including dragged stop
					start: {down: oldIndex, up: newIndex},
					//loop will end at the already-reformated stop with the highest index (furthest 'down') -- including dragged stop
					end: {down: newIndex, up: oldIndex},
				}
			};
			
			var loop = pickLoop.reformat;
			//reformat each displaced stop to reflect its new index and add it to the temp array
			for (var i = loop.start[dir]; i <= loop.end[dir]; i++){
				reformatStop(stops[i], loop.shift[dir]);
				tempStops.push(stops[i]);
			}	
			//reformat the dragged stop and add it to either the begining or the end of the array depending on which direction it was dragged
			reformatStop(movedStop, unitsShifted);
			unitsShifted > 0 ? tempStops.push(movedStop) : tempStops.unshift(movedStop);
			
			//reformating a stop will...
			function reformatStop(stop, shft){
				stop
					//increment or decrement the stop's index
					.setIndex(stop.getIndex() + shft)
					//generate new label corresponding to stop's new index (top value and icon will be different)
					.replaceLabel()
					//generate new marker corresponding to stop's new index (icon will be different)
					.replaceMarker()
					//enable swapping on stop's new label
					.enableSwap();
			};
			
			loop = pickLoop.reassign;
			//reassign each stop's position in the stops array to reflect its new internally stored index value (this.index)
			for (var i = loop.start[dir]; i <= loop.end[dir]; i++){	
				stops[i] = tempStops[i - loop.start[dir]];//index of tempStops offset by the value of the lowest object index (this.index) in tempStops
			}			
		}
	});
};
//****************************************************************

function appendUrlGetter(){
	$('#route-wrapper').append('<div id="url-wrapper"><button type="button" id="url-button">Get URL</button></div>');		    
}

function getUrl(stops){
	var url = 'http://badideafactory.net/scripts/routeMapper/v3/routeSharer.html?',
		urlObj ={};
	for (var i=0; i < stops.length; i++){
		if (url != 'http://badideafactory.net/scripts/routeMapper/v3/routeSharer.html?'){
			url += '&';
		}
		url +=  'stop' + i + 'id=' + stops[i].data.id + '&stop' + i + 'type=' + stops[i].type;
	}
	url += '&numStops=' + stops.length;
	console.log(url);
	getBitly(url);
}

function getBitly(url){
	$.ajax({
		url: 'https://api-ssl.bitly.com/v3/shorten?access_token=9e8c278435821bc2cb62206c8558c57b5ef2ae7b&longUrl='+ encodeURIComponent(url),
		type: 'get' 
	}).fail(function(textStatus, errorThrown){
		console.log('The following error occured with your ajax request to bit.ly:\n' + textStatus + '\n' + errorThrown);
		appendUrlError();
	}).done(function (response){
		appendUrl(response.data.url);
	})	
}

function appendUrl(url){
	$('#url-text').length == 0 ?
		$('#url-wrapper').append('<div id="#url-text"><a href="' + url + '">'+ url +'</a></div>') :
		$('#url-text').replaceWith('<div id="#url-text">' + url + '</div>');
}

function appendUrlError(){
	$('#url-text').length == 0 ?
		$('#url-wrapper').append('<div id="#url-text">There was an error retrieving a URL for this map. See the console for details.</div>') :
		$('#url-text').replaceWith('<div id="#url-text">' + url + '</div>');
}



