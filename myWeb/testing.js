// Define the osMap variable
var osMap; 
var GMAP;
var mapPointX;
var mapPointY;
var focusPoint;
var lon;
var lat;
var ULeftCoodinate;

function error(e, s){
    alert(e+" in "+s);
}

// This function creates the map and is called by the div in the HTML
function initOSMap()
{
    // Create new map
    osMap = new OpenSpace.Map('OSmap');
    mapPointX = 400000;
    mapPointY = 400000;
    focusPoint = new OpenSpace.MapPoint(mapPointX, mapPointY);
    osMap.gridProjection = new OpenSpace.GridProjection();
    // Set map centre in National Grid Eastings and Northings and select zoom level 8
	osMap.setCenter(focusPoint, 8);       
}

function initGMap() {
	var mapDiv = document.getElementById('Gmap');
    GMAP = new google.maps.Map(mapDiv, {
        center: {lat: 53.496718204694, lng: -2.0014692557496},
        zoom: 14
    });
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

function updateLocation()
{
	try{
		focusPoint = osMap.getCenter();
		mapPointX = focusPoint.getEasting();
		mapPointY = focusPoint.getNorthing();
		var lonlat = osMap.gridProjection.getLonLatFromMapPoint(focusPoint);
		lon = lonlat.lon;
		lat = lonlat.lat;		
	}
    catch(e){
		error(e, "updateLocation");
    }	
}

function centerValue()
{
	//var myCenter=document.getElementById("myCenter");
	//document.write(osMap.getCenter());
	try{
		updateLocation();
	    document.getElementById("myCenter").innerHTML = "Focus Center: X " + mapPointX + " Y " + mapPointY;
		var pos = new OpenSpace.MapPoint(mapPointX, mapPointY);
		var marker = new OpenLayers.Marker(pos);
	    markers.addMarker(marker);
	}
    catch(e){
		error(e, "centerValue");
    }	
}

function ULeft()
{
	//var myCenter=document.getElementById("myCenter");
	//document.write(osMap.getCenter());
	try{
		updateLocation();
		document.getElementById("myULeft").innerHTML = "Upper Left: X " + (mapPointX-1000) + " Y " + (mapPointY+2000);
		var pos = new OpenSpace.MapPoint(mapPointX-1000, mapPointY+2000);
		var marker = new OpenLayers.Marker(pos);
	    markers.addMarker(marker);
	}
    catch(e){
		error(e, "ULeft");
    }	
}


function URight()
{
	//var myCenter=document.getElementById("myCenter");
	//document.write(osMap.getCenter());
	try{
		updateLocation();	
		document.getElementById("myURight").innerHTML = "Upper Right: X " + (mapPointX+2000) + " Y " + (mapPointY+2000);
		var pos = new OpenSpace.MapPoint(mapPointX+2000, mapPointY+2000);
		var marker = new OpenLayers.Marker(pos);
	    markers.addMarker(marker);
	}
    catch(e){
		error(e, "URight");
    }

}

function BLeft()
{
	//var myCenter=document.getElementById("myCenter");
	//document.write(osMap.getCenter());
	try{
		updateLocation();
		document.getElementById("myBLeft").innerHTML = "Bottom Left: X " + (mapPointX-1000) + " Y " + (mapPointY-1000);
		var pos = new OpenSpace.MapPoint(mapPointX-1000, mapPointY-1000);
		var marker = new OpenLayers.Marker(pos);
	    markers.addMarker(marker);
    }
    catch(e){
		error(e, "BLeft");
    }    

}

function BRight()
{
	//var myCenter=document.getElementById("myCenter");
	//document.write(osMap.getCenter());
	try{
		updateLocation();
		document.getElementById("myBRight").innerHTML = "Bottom Right: X " + (mapPointX+2000) + " Y " + (mapPointY-1000);
		var pos = new OpenSpace.MapPoint(mapPointX+2000, mapPointY-1000);
		var marker = new OpenLayers.Marker(pos);
	    markers.addMarker(marker);
	}
    catch(e){
		error(e, "BRight");
    }	
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

function point2LonLat(){
	try{
		updateLocation();
		document.getElementById("myLonlatCenter").innerHTML = "LonLat Center: lon " + lon + " lat " + lat;
	}
    catch(e){
		error(e, "point2lonlat");
    }	
}

function point2lonlat(point){
	try{
		var lonlat = osMap.gridProjection.getLonLatFromMapPoint(point);
		return lonlat;
	}
    catch(e){
		error(e, "point2lonlat(point)");
    }	
}

function syncGMap(){
    try{
    	updateLocation();
		var mapDiv = document.getElementById('Gmap');
	    GMAP = new google.maps.Map(mapDiv, {
	        center: {lat: lat, lng: lon},
	        zoom: 14
	    });		
    }
    catch(e){
		error(e, "mapcanvas");
    }	
}

function saveCoordinate(){
	updateLocation();
	ULeftCoodinate = new OpenSpace.MapPoint(mapPointX-1000, mapPointY+2000);
	var blobXY = new Blob([ULeftCoodinate], {type : "text/plain;charset=utf-8"});
	saveAs(blobXY, "originCoordinate.txt");
}
