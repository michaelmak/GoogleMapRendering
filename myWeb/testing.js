// Define the osMap variable
var osMap;

// This function creates the map and is called by the div in the HTML
function init()
{
    // Create new map
    osMap = new OpenSpace.Map('map');
    // Set map centre in National Grid Eastings and Northings and select zoom level 8
	osMap.setCenter(new OpenSpace.MapPoint(400000, 400000), 8);
            
}