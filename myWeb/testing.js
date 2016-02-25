// Define the osMap variable
var osMap; 
var GMAP;
var mapPointX;
var mapPointY;
var focusPoint;
var lon;
var lat;


// This function creates the map and is called by the div in the HTML
function init()
{
    // Create new map
    osMap = new OpenSpace.Map('map');
    mapPointX = 400000;
    mapPointY = 400000;
    focusPoint = new OpenSpace.MapPoint(mapPointX, mapPointY);
    osMap.gridProjection = new OpenSpace.GridProjection();
    // Set map centre in National Grid Eastings and Northings and select zoom level 8
	osMap.setCenter(focusPoint, 8);            
}

// Assign a new markers layer to a variable 
var markers = new OpenLayers.Layer.Markers("Markers");

function left()
{
	mapPointX = mapPointX-1000;
	focusPoint = new OpenSpace.MapPoint(mapPointX, mapPointY);
	osMap.setCenter(focusPoint, 8);
}

function right()
{
	mapPointX = mapPointX+1000;
	focusPoint = new OpenSpace.MapPoint(mapPointX, mapPointY);
	osMap.setCenter(focusPoint, 8);
}

function up()
{
	mapPointY = mapPointY+1000;
	focusPoint = new OpenSpace.MapPoint(mapPointX, mapPointY);
	osMap.setCenter(focusPoint, 8);
}

function down()
{
	mapPointY = mapPointY-1000;
	focusPoint = new OpenSpace.MapPoint(mapPointX, mapPointY);
	osMap.setCenter(focusPoint, 8);
}

function centerValue()
{
	//var myCenter=document.getElementById("myCenter");
	//document.write(osMap.getCenter());
    document.getElementById("myCenter").innerHTML = "Focus Center: X " + mapPointX + " Y " + mapPointY;
	var pos = new OpenSpace.MapPoint(mapPointX, mapPointY);
	var marker = new OpenLayers.Marker(pos);
    markers.addMarker(marker);
}

function ULeft()
{
	//var myCenter=document.getElementById("myCenter");
	//document.write(osMap.getCenter());

	document.getElementById("myULeft").innerHTML = "Upper Left: X " + (mapPointX-1000) + " Y " + (mapPointY+2000);
	var pos = new OpenSpace.MapPoint(mapPointX-1000, mapPointY+2000);
	var marker = new OpenLayers.Marker(pos);
    markers.addMarker(marker);
}

function URight()
{
	//var myCenter=document.getElementById("myCenter");
	//document.write(osMap.getCenter());

	document.getElementById("myURight").innerHTML = "Upper Right: X " + (mapPointX+2000) + " Y " + (mapPointY+2000);
	var pos = new OpenSpace.MapPoint(mapPointX+2000, mapPointY+2000);
	var marker = new OpenLayers.Marker(pos);
    markers.addMarker(marker);

}

function BLeft()
{
	//var myCenter=document.getElementById("myCenter");
	//document.write(osMap.getCenter());

	document.getElementById("myBLeft").innerHTML = "Bottom Left: X " + (mapPointX-1000) + " Y " + (mapPointY-1000);
	var pos = new OpenSpace.MapPoint(mapPointX-1000, mapPointY-1000);
	var marker = new OpenLayers.Marker(pos);
    markers.addMarker(marker);

}

function BRight()
{
	//var myCenter=document.getElementById("myCenter");
	//document.write(osMap.getCenter());

	document.getElementById("myBRight").innerHTML = "Bottom Right: X " + (mapPointX+2000) + " Y " + (mapPointY-1000);
	var pos = new OpenSpace.MapPoint(mapPointX+2000, mapPointY-1000);
	var marker = new OpenLayers.Marker(pos);
    markers.addMarker(marker);

}

function switchMarker(){
    try{
		var button = document.getElementById("switchMarker");
		if(button.value == "Switch Marker On"){
			osMap.addLayer(markers);
	    	button.value = "Switch Marker Off";
		}
		else{
			osMap.removeLayer(markers);
			button.value = "Switch Marker On";
		}    
	}
    catch(e){
		error(e, "switchMarker");
    }
}

function point2lonlat(){
	var lonlat = osMap.gridProjection.getLonLatFromMapPoint(focusPoint);
	lon = lonlat.lon;
	lat = lonlat.lat;
	document.getElementById("myLonlatCenter").innerHTML = "LonLat Center: lon " + lon + " lat " + lat;
}


