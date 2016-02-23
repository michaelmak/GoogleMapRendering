// Define the osMap variable
var osMap; 
var mapPointX;
var mapPointY;

// This function creates the map and is called by the div in the HTML
function init()
{
    // Create new map
    osMap = new OpenSpace.Map('map');
    mapPointX = 400000;
    mapPointY = 400000;
    // Set map centre in National Grid Eastings and Northings and select zoom level 8
	osMap.setCenter(new OpenSpace.MapPoint(mapPointX, mapPointY), 8);            
}

function left()
{
	mapPointX = mapPointX-100;
	osMap.setCenter(new OpenSpace.MapPoint(mapPointX, mapPointY), 8);
}