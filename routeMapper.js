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
function showInfo(tabletop) {
	this.tabletop = tabletop;
	callback = this;
	gMap = initMap();

	$('#pick-date').click(function(){
		//store datepicker value
		date = $('#date').val();
		//use that value to filter all orders from spreadsheet matching that date
		orders = filterByDate(callback.tabletop['payments'].elements, date);
		//if no stop objects exist, construct them, if they exist, replace them
		stops = typeof(stops) == 'undefined' ? 
			setStops(gMap, orders) : 
			replaceStops(gMap, orders);
		//on click, retrieve a bit.ly permalink for the map
		$('#url-button').click(function(){
			getUrl(stops);
		});

	});	
};
//******************************************

//initialize map centered on Crown Heights Farm Share
function initMap() {
	gooGeo = new google.maps.LatLng(40.674799, -73.954362);
		mapOptions = {
			center: gooGeo,
			zoom: 13,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
	return new google.maps.Map(document.getElementById('map-canvas'),mapOptions);
};

function filterByDate(orders, date){
	var tempOrders = [],
		filter = new Date(date),
		feeds = [];
	for (var i = 0; i <orders.length; i++){
		feeds[i] = new Date(formatDate(orders[i].pickupdate));
		if (feeds[i].getYear() == filter.getYear() && 
			feeds[i].getMonth() == filter.getMonth() && 
			feeds[i].getDate() == filter.getDate() && 
			orders[i].pickupneeded == 'TRUE'
		){
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

// Stores spreadsheet data in variables, creates array of stop objects for use in mapping
function setStops(map, orders){

	//store order data as array of objects and delete extraneous objects
	var stops = [];

	//build stop objects based off order data
	for (var i = 0; i < orders.length; i++){
		stops[i] = new Stop(orders[i], i, map);
		stops[i]
			.setMarker(gMap)
			.setInfoWindow(gMap)
			.appendLabel()
			.enableSwap();
	}
	appendUrlGetter();
	return stops;
};

function replaceStops(map, orders){
	$('#route-stops').empty();
	for (var i = 0; i < stops.length; i++){
		stops[i].map.infoWindow.setMap(null);
		stops[i].map.marker.setMap(null);
		delete stops[i];	
	}
	return setStops(map, orders);
};


//*****************************************************
//*STOP CONSTRUCTOR FUNCTION (does the bulk of the work)
function Stop(order, index, map) {	
	
	//PROPERTIES
	
	//set reference variable for closures
	that = this;
	
	//store the stop's index value
	this.index = index;

	//set spacing unit for labels based off routeMapper.html's css
	this.spacingUnit = 32;
	
	//clone order data from spreadsheet
	this.order = {
		name: order.restaurantname, 
		address: order.address, 
		invoiceAmount: order.invoiceamount,
		totalOwed: order.totalowed,
		paymentType: order.paymenttype,
		rowNum: order.rowNumber
	};

	//store initialized map and stop's geocode; leave space for creating its marker and info window
	this.map = {
		map: map,
		lat: order.lat,
		lng: order.lng,
		marker : {}, //<-- set later with accessor method
		infoWindow: {} //<-- set later with accessor method
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
	this.getIcon = function() {
		return'../../../../img/icons/numbers/green_' + (this.index + 1) + '.png';
	};
	
	//retrieve stop's label (dependent on index)
	this.getLabel = function(){
		return '<div class="stop-container" id="stop-container' + this.index + '" style="top: ' + this.index*this.spacingUnit + '"><div class="stop-wrapper" id="stop-wrapper' + this.index + '"><img class ="stop-icon" id="stop-icon' + this.index + '"src="' + this.getIcon() + '"/><div class="stop-text">' + this.order.address + '</div></div></div>';		
	};

	//adds stop labels to DOM according to specifications in stop.label
	this.appendLabel = function() {
		$('#route-stops').append(this.getLabel());
		return this;
	};
	
	//replaces label elements in DOM after index has been changed 
	this.replaceLabel = function(){
		$('#stop-container' + this.index).replaceWith(this.getLabel());
		return this;		
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
	
	this.replaceMarker = function(){
		this.map.marker.setIcon(this.getIcon());
		return this;
	}
	
	
	this.setInfoWindow = function(){
		var map = this.map,
			contentStr = '';
		for (var i in this.order){
			if (i != 'rowNum'){
				contentStr +=  '<strong>' + i.charAt(0).toUpperCase() + i.slice(1) + ':</strong> ' + this.order[i] + '<br/>';				
			}
		}
		map.infoWindow = new google.maps.InfoWindow({
			content: contentStr	
		});
		google.maps.event.addListener(map.marker, 'click', function() {
		    clearInfoWindows(stops, that.index);
		    map.infoWindow.open(map.map, map.marker);
		});
		
		return this;
	}	
	this.enableSwap = function(){
		enableSwap(this);
	};
	return this;
}; 

function clearInfoWindows(stops, index){
	for (var i=0; i<stops.length; i++){
		if (i !== index)
		stops[i].map.infoWindow.close();
	}
}

function enableSwap(stop){ // <-- make this a method of Stop()?
	
	this.spacingUnit = stop.spacingUnit
	var swap = this;

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
			unitsShifted = (parseInt($(this).css('top').replace('px', '')) / swap.spacingUnit);
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
					.replaceMarker(gMap)
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
	$('#route-stops').append('<div id="url-wrapper"><button type="button" id="url-button">Get URL</button></div>');		    
}

function getUrl(stops){
	var url = 'http://badideafactory.net/scripts/routeMapper/v1/bks/routeSharer.html?',
		urlObj ={};
	for (var i=0; i < stops.length; i++){
		if (url != 'http://badideafactory.net/scripts/routeMapper/v1/bks/routeSharer.html?'){
			url += '&';
		}
		url += 'stop' + i + 'rowNum=' + stops[i].order.rowNum;
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



