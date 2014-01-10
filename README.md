routeMapper
===========

JS script that pulls addresses from a google spreadsheet and plots them on a re-orderable

FUNCTIONALITY:
* pulls order data from google spreadsheet, parses as JSON
* filters orders by date
* plots date-filtered orders to map 
* order markers are indexed by sequence in delivery route
* marker pop-ups contain all data for the corresponding order
* UI provides draggable icons to allow user to edit and optimize route sequence
* UI allows user to generate bit.ly permalink to map of optimized route (can be texted/emailed to delivery workers, etc..)

USAGE:
* create a google spreadsheet with a list of addresses and information associated with those addresses
* there should be a tab for dropoffs and a tab for pickups 
* publish the spreadsheet to the web and store the key
* adjust the variables in routeMapper.js to correspond to the key (and if necessary, different column names) of your spreadsheet
* host the script somewhere, navigate to that page
* provide a date for the route you'd like to map
* use the sidebar UI to drag icons and rearrange the route
* click "generate URL" to generate a permalink to the final route

DEPENDENCIES:
* jquery
* tabletop.js
* leaflet.js