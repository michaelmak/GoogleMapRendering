// Define the osMap variable
var osMap; 
var GMAP;
var mapPointX;
var mapPointY;
var focusPoint;
var lon;
var lat;
var ULeftCoodinate;
var easting4Trans;
var northing4Trans; 

// alert error and function message
function error(e, s){
    alert(e+" in "+s);
}

// This function creates the map and is called by the div in the HTML
function initOSMap()
{
	try{
	    // Create new map
	    osMap = new OpenSpace.Map('OSmap');
	    mapPointX = 400000;
	    mapPointY = 400000;
	    focusPoint = new OpenSpace.MapPoint(mapPointX, mapPointY);
	    osMap.gridProjection = new OpenSpace.GridProjection();
	    // Set map centre in National Grid Eastings and Northings and select zoom level 8
		osMap.setCenter(focusPoint, 8);    
	}
    catch(e){
		error(e, "testing.initOSMap");
    }   
}

function initGMap() {
	try{
		var mapDiv = document.getElementById('Gmap');
	    GMAP = new google.maps.Map(mapDiv, {
	        center: {lat: 53.496718204694, lng: -2.0014692557496},
	        zoom: 14
	    });
    }
    catch(e){
		error(e, "testing.initGMap");
    }
}

// Assign a new markers layer to a variable 
var markers = new OpenLayers.Layer.Markers("Markers");

function left()
{
	try{
		mapPointX = mapPointX-1000;
		focusPoint = new OpenSpace.MapPoint(mapPointX, mapPointY);
		osMap.setCenter(focusPoint, 8);
	}
    catch(e){
		error(e, "testing.left");
    }
}

function right()
{
	try{
		mapPointX = mapPointX+1000;
		focusPoint = new OpenSpace.MapPoint(mapPointX, mapPointY);
		osMap.setCenter(focusPoint, 8);
	}
    catch(e){
		error(e, "testing.right");
    }
}

function up()
{
	try{
		mapPointY = mapPointY+1000;
		focusPoint = new OpenSpace.MapPoint(mapPointX, mapPointY);
		osMap.setCenter(focusPoint, 8);
	}
    catch(e){
		error(e, "testing.up");
    }
}

function down()
{
	try{
		mapPointY = mapPointY-1000;
		focusPoint = new OpenSpace.MapPoint(mapPointX, mapPointY);
		osMap.setCenter(focusPoint, 8);
	}
    catch(e){
		error(e, "testing.down");
    }
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
		error(e, "testing.updateLocation");
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
		error(e, "testing.centerValue");
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
		error(e, "testing.ULeft");
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
		error(e, "testing.URight");
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
		error(e, "testing.BLeft");
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
		error(e, "testing.BRight");
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
		error(e, "testing.switchMarker");
    }
}

function point2LonLat(){
	try{
		updateLocation();
		document.getElementById("myLonlatCenter").innerHTML = "LonLat Center: lon " + lon + " lat " + lat;
	}
    catch(e){
		error(e, "testing.point2lonlat");
    }	
}

function point2lonlat(point){
	try{
		var lonlat = osMap.gridProjection.getLonLatFromMapPoint(point);
		return lonlat;
	}
    catch(e){
		error(e, "testing.point2lonlat(point)");
    }	
}

// set GMap to the same location as OSMAP
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
		error(e, "testing.syncGMap");
    }	
}

/*
  FileInput Credit for:
  http://www.htmlgoodies.com/beyond/javascript/read-text-files-using-the-javascript-filereader.html#fbid=PBxGTbwApc_
  https://www.w3.org/TR/FileAPI/
*/
function saveCoordinate2File(){
	try{	
		updateLocation();
		var X = mapPointX-1000;
		var Y = mapPointY+2000;
		//ULeftCoodinate = new OpenSpace.MapPoint(mapPointX-1000, mapPointY+2000);
		var blobXY = new Blob([X + " " + Y], {type : "text/plain;charset=utf-8"});
		saveAs(blobXY, "originCoordinate.txt");
	}
	catch(e){
		error(e, "testing.saveCoordinate2File");
    }
}

function loadCoordinateFromFile(){
	// function credit for http://www.html5rocks.com/en/tutorials/file/dndfiles/
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
    	function readSingleFile(evt) {
        	//Retrieve the first (and only!) File from the FileList object
        	var f = evt.target.files[0]; 

        	if (f) {
	        	var r = new FileReader();
    	    	r.onload = function(e) { 
        	    	var str = e.target.result;
    	        	alert( "Got the file\n" 
        	        	  +"name: " + f.name + "\n"
    	    	          +"type: " + f.type + "\n"
        	    	      +"size: " + f.size + " bytes\n"
            	    	  + "starts with: " + str.substr()
   		         	      ); 
	    	        var res = str.split(" ");
    	    	    easting4Trans = res[0];
        		    northing4Trans = res[1]; 
            		//document.write(easting4Trans + "/" + northing4Trans);
   	 			}
        	  	r.readAsText(f);
        	  	loadImage();
    	    } 
        	else { 
          		alert("Failed to load file");
        	}
      	}
		document.getElementById('fileinput').addEventListener('change', readSingleFile, false);
    } 
    else {
      alert('The File APIs are not fully supported by your browser.');
    }
}

function getEasting4Trans() {
	return easting4Trans;
}

function getNorthing4Trans() {
	return northing4Trans;
}

function loadImage()
{
	try{	
	  var img = new Image();
	  //img.crossOrigin = 'anonymous';
	  img.onload = function ()
	  {
	    createCanvas(img);
	  }
	  /*
	  1Grid: 
	  upLeft   = 399000,400000
	  upRight  = 400000,400000
	  downLeft = 399000,399000
	  downLeft = 400000,399000
	  */
	  img.src = 'screenshot.png';
	  //img.src = '1Grid.png'; //upLeft   = 399000,400000
	  //img.src = '4Grids.png';
	  //img.src = '4Grids 406000 408005.png';
	  //img.src = '9Grids 399000 401000.png';
	  //img.src = 'OSMAP2.png';
	  //img.src = '9Grids 405000 409995.png';
	  //img.src = 'Screen Shot 2016-03-04 at 12.03.03 am.png'; //eastings=401000,northings=370000
	  //img.src = 'Screen Shot 2016-03-01 at 3.21.33 pm.png'; //405005 410005
	  //img.src = 'Screen Shot 2016-03-01 at 5.14.05 pm.png'; //419000 402000
	  //img.src = 'Screen Shot 2016-03-01 at 3.21.33 pm.png'; //405005 410005
	  //img.src = 'Screen Shot 2016-03-03 at 3.49.46 pm.png'; //eastings=401000,northings=389000
	  //img.src = 'Screen Shot 2016-03-03 at 3.58.48 pm.png'; //eastings=401000,northings=389000
	  //img.src = 'Screen Shot 2016-03-03 at 4.07.02 pm.png'; // eastings=407995,northings=395000
	  //img.src = 'Screen Shot 2016-03-03 at 5.29.30 pm.png'; // eastings=400010,northings=400005  
	  //img.src = "Screen Shot 2016-02-24 at 4.12.51 pm.png";    
	  //img.src = "Screen Shot 2016-02-25 at 10.53.04 pm.png";   
	  //img.src = "Screen Shot 2016-03-04 at 4.11.12 pm.png"; //eastings=388005,northings=380000
	  //img.src = "Screen Shot 2016-03-11 at 1.24.36 pm.png";  //410000 425000
	  //img.src = "Screen Shot 2016-03-11 at 3.02.34 pm.png"; //402005 414000  
	  //img.src = "Screen Shot 2016-02-26 at 8.41.20 pm.png";
	  //img.src = "Screen Shot 2016-03-11 at 3.26.17 pm.png"; //397985 411998.125
	}
	catch(e){
		error(e, "testing.loadImage");
    }
}
