/*
 * At any time, there is a currently selected path and an associated
 * set of points. We also have other paths, which are not currently
 * selected. The global variable 'PATH' contains the selected path; in
 * other places where we need a variable to hold a path we use 'path'.
 *
 * We use various built-in Google objects -- PolyLines, Markers,
 * LatLngs, InfoWindows. But we do cheapskate extensions by adding
 * fields to them. A lot of these extra fields are links to other
 * items, so that a path has a a set of points, each of which may have
 * a marker. But a point has a link to the path that it lies on, and a
 * marker has a link to the point it is attached to. So we gets lots
 * of interconnectivity. Nothing mysterious about that, but we do have
 * to be careful to ensure that we keep all the links up-to-date.
 *
 * We are also fairly liberal in treating DOM objects as simple
 * datastructures. That's the only way to get reasonable communication
 * between the PHP and the JavaScript. Getting the timing between PHP
 * events and map events can be tricky. 
 *
 * The most complicated thing is when a map event triggers a call of
 * submit and you need to get information out of the map before the
 * submit actually happens. The exemplar is what happens when you
 * click on the map in 'retrieve' mode and you want the next instance
 * of the map to be centred at the point where you clicked. We add a
 * POST variable called 'here' to the form before we submit it; then
 * when the new instance of the page is created, we extract this
 * variable and stick it in a hidden input; and then when initialise
 * is called in the new page, it can inspect this input item and work
 * out where to centre the new version of the map. Can't see an easier
 * way to do it!
 *
 * The other tricky thing is that when you use Google 'services' (like
 * the one for calculating spot heights, they can take a while to
 * respond. These things are handled by 'callbacks', which are
 * functions that get called by the service request. Because we don't
 * know when this will actually happen, we can't just issue a request
 * and assume that its results will be immediately available. This often
 * means that we have to supply whatever is supposed to happen next as a
 * 'continuation'. 
 */

var PROFILEMARKER = null;
var PATH = null;
var USINGOS = true;
var USINGLARGEOS = true;
var GMAP = null;

function error(e, s){
    alert(e+" in "+s);
}

/*
 * Used when we have a function that expects a continuation but we don't actually
 * want to do anything
 */
function identity(){}

function chooseRadioButton(name){
    var choices = document.getElementsByName(name);
    for(var i=0; i<choices.length; i++){
        choice = choices[i];
        if(choice.checked){
            return choice;
        }
    }
    return false;
}

function chooseDiv(chosen, notchosen, size){
    try{
	var div;
	for(var i=0; i<notchosen.length; i++){
	    div = document.getElementById(notchosen[i]);
	    div.style.visibility = 'visible';
	    div.style.height = '1px';
	    div.style.visibility = 'hidden';
	} 
	div = document.getElementById(chosen);
	div.style.visibility = 'visible';
	div.style.height = size;
    }
    catch(e){
	error(e, "chooseDiv");
    }
}

function chooseMode(){
    try{
	var mode = chooseRadioButton("mode");
	if(!mode){
	    mode = document.getElementById("editButton");
	}
	mode.checked = true;
	chooseDiv(mode.value, ["editDiv", "retrieveDiv", "listDiv"]);
    }
    catch(e){
	error(e, "chooseMode");
    }
}

function switchMainMaps(){
    try{
	var size = gmapSize();
	var mmButton = document.getElementById("switchMainMap");
	if(mmButton.value == "Switch main window to Google map"){
	    if(USINGLARGEOS){
		LargeOSMAP.div.style.height = '1px';
		LargeOSMAP.div.style.visibility = 'hidden';
	    }
	    GMAP.div.style.height = size['H']+'px';
	    GMAP.div.style.visibility = 'visible';
	    mmButton.value = "Switch main window to OS map";
	}
	else{
	    GMAP.div.style.height = '1px';
	    GMAP.div.style.visibility = 'hidden';
	    if(USINGLARGEOS){
		LargeOSMAP.div.style.height = size['H']+'px';
		LargeOSMAP.div.style.visibility = 'visible';
	    }
	    mmButton.value = "Switch main window to Google map";
	}
    }
    catch(e){
	error(e, "switchMainMaps");
    }
}

function switchSmallMaps(){
    try{
	var size = smallcanvasSize();
	var mmButton = document.getElementById("switchSmallWindow");
	if(mmButton.value == "Small window is currently showing OS map--switch to elevation"){
	    OSMAP.div.style.height = '1px';
	    OSMAP.div.style.visibility = 'hidden';
	    profileCanvasDiv.style.height = size['H']+'px';
	    profileCanvasDiv.style.visibility = 'visible';
	    mmButton.value = "Small window is currently showing elevation--switch to OS map";
	}
	else{
	    profileCanvasDiv.style.height = '1px';
	    profileCanvasDiv.style.visibility = 'hidden';
	    OSMAP.div.style.height = size['H']+'px';
	    OSMAP.div.style.visibility = 'visible';
	    mmButton.value = "Small window is currently showing OS map--switch to elevation";
	}
    }
    catch(e){
	error(e, "switchSmallWindow");
    }
}

COLOURS = ["#FF8C00","#FF0000", "#FF00FF","#00FFCC"];
COLOURCOUNTER = 0;
BLUE = "#00f";
BLACK = 0;

function nextColour(){
    if(COLOURCOUNTER == COLOURS.length-1){
	COLOURCOUNTER = 0;
    }
    else{
	COLOURCOUNTER = COLOURCOUNTER+1;
    }
    return COLOURS[COLOURCOUNTER];
}

function distance(x, y){
    return google.maps.geometry.spherical.computeDistanceBetween(x, y);
}

function pathLength(path){
    try{
	var l = 0;
	var points = path.points;
	if(points == undefined || points[0] == undefined){
	    return 0;
	}
	points[0].distanceFromOrigin = 0;
	for(var i=0; i<points.length-1; i++){
	    l = l+distance(points[i], points[i+1]);
	    points[i+1].distanceFromOrigin = l;
	}
	path.data.pathLength = l;
	for(var i=0; i<points.length; i++){
	    points[i].distanceFromOrigin = points[i].distanceFromOrigin/l;
	}
	return l;
    }
    catch(e){
	error(e+" in pathLength");
    }
}

/*
 * There's a horrible complication here: getElevationForLocations seems to
 * return at most 400 points, so if you want to get the elevations for a 
 * longer path than that, you have to do it in stages. So we get them in
 * batches of 200: get the next 200 points on the path for which you haven't
 * got the elevation; if there are still points that you need to look at,
 * do another call of pathAscentAndDescent. This could get into
 * a loop. because the termination condition depends on something
 * we have no control over, namely the number of results returned
 * by the service request. The best I can do is to ensure that at
 * least something was returned--the dangerous case would be if 
 * nothing at all was: if anything is returned then we are making
 * progress, so we are getting nearer to the termination condition.
 */

function setElevationCallback(path, points, contn){
    return function (results, status){
	try{
	    if(results == null){
		return;
	    }
	    for(var i=0; i<results.length; i++){
		points[i].elevation = results[i].elevation;
	    }
	    var prev = false;
	    var ascent = 0;
	    var descent = 0;
	    for(var i=0; i<path.points.length; i++){
		e = path.points[i].elevation;
		if(e == undefined){
		    /*
		     * There were still some points without an
		     * elevation: have another go.
		     */
		    pathAscentAndDescent(path, contn);
		    return;
		}
		if(prev){
		    var d = e-prev;
		    if(d>0){
			ascent = ascent+d;
		    }
		    else{
			descent = descent+d;
		    }
		}
		prev = e;
	    }	
	    path.data.ascent = ascent;
	    path.data.descent = descent;
	    if(path == PATH){
		plotProfile();
	    }
	    contn();
	}
	catch(e){
	    error(e, "elevations");
	}
    }
}

/*
 * Getting elevation data is a bit complicated, and a bit slow. So we only
 * do it at points when we are actually going to use this data, i.e. when we
 * are going to display it (which happens when you move the mouse over a
 * marker that expects to display it) or when we are about to copy it into
 * the database. Will also do it when we have to display the vertical profile,
 * when that's working. Because it's a slow, we will cache it whenever 
 * possible; and because it's a service, and hence we don't know how long it
 * will take to get it, we will pass in whatever is supposed to happen next
 * as a continuation. If the data is in fact cached, we call the continuation
 * immediately, otherwise we pass on to the service request.
 */
function pathAscentAndDescent(path, contn){
    try{
	points = [];
	for(var i=0; i<path.points.length; i++){
	    if(path.points[i].elevation == undefined){
		points.push(path.points[i]);
		if(points.length > 200){
		    break;
		}
	    }
	}
	var positionalRequest = {
	    'locations': points
	}
	/*
	 * It's difficult to get information returned from a callback:
	 * the only way I can see to do it is that the callback knows
	 * about local variables of the calling function, so we can
	 * attach the items that the callback supplies to items that
	 * are already available in the main function.
	 *
	 * The timing is tricky, because the fact that we've made the
	 * request can return before the request itself has been
	 * completed.  This has the consequence that you can't just
	 * make the request and assume that you immediately have the
	 * information (in this case the heights). The correct way to
	 * deal with this is by supplying whatever is supposed to happen
	 * next as a 'continuation', i.e. as a function which was created
	 * at the point when pathAscentAndDescent was called, and which 
	 * contains pointers to all the structures that we need to inspect
	 * and update once the request has been dealt with.
	 */
	elevator.getElevationForLocations(positionalRequest, setElevationCallback(path, points, contn));
    }
    catch(e){
	error(e, "pathAscentAndDescent");
    }
}

function setScales(){
    if(chooseRadioButton("measures").value == "miles,feet"){
	HSCALE = 1/1.609344;
	VSCALE = 3.280839895013123;
	UNITS = ['m', "'"];
    }
    else{
	HSCALE = 1;
	VSCALE = 1;
	UNITS = ['k', "m"];


    }
    document.getElementById("hscale").value = HSCALE;
    document.getElementById("vscale").value = VSCALE;
}

function hscale(d){
    return (HSCALE*d/1000).toFixed(2)+" "+UNITS[0];
}
 
function vscale(h){
    return (VSCALE*h).toFixed(1)+" "+UNITS[1];
}

function pathDetails(path){
    var details = "";
    var name = path.data.name;
    if(!(name == "")){
	details = "<b>"+name+"</b><br>";
    }
    setScales();
    details = details+"Length "+hscale(path.data.pathLength)+"<br>";
    var ascent = path.data.ascent;
    if(!(ascent=="NaN")){
	details = details+"Total ascent "+vscale(ascent)+"<br>";
    }
    var descent = path.data.descent;
    if(!(descent=="NaN")){
	details = details+"Total descent "+vscale(descent)+"<br>";
    }
    var contributor = path.data.contributor;
    if (!(contributor == undefined || contributor == "")){
	details = details+"Contributed by "+contributor+"<br>";
    }
    return details;
}

function backToLastPoint(points){
    try{
	if(points.length > 0){
	    var p = points.pop();
	    closeMarker(p.marker);
	    while(points.length > 0 && points[points.length-1].internal){
		p = points.pop();
		closeMarker(p.marker);
	    }
	}
    }
    catch(e){
	error(e+" in backToLastPoint");
    }
}

function undo(){
    try{
	if(PATH == null || PATH.points == null){
	    return;
	}
	if(PATH.points.length == 1){
	    closeMarker(PATH.points[0].marker);
	    closeMarker(PATH.endMarker);
	    PATH = null;
	    return;
	}
	backToLastPoint(PATH.points);
	var points = PATH.points;
	PATH.polyline.setVisible(false);
	PATH.polyline = new google.maps.Polyline({
	    map: GMAP,
	    path: PATH.points,
	    strokeColor: BLUE,
	    strokeOpacity: 1.0,
	    strokeWeight: 5,
	    clickable: false
	});
	if(USINGOS){
	    if(PATH.osline){
		OSMAP.osvectorlayer.destroyFeatures([PATH.osline]);
		if(USINGLARGEOS){
		    LargeOSMAP.osvectorlayer.destroyFeatures([PATH.osline]);
		}
	    }
	    drawPathAsOSLine(PATH, BLUE);
	}
	HERE = points[points.length-1];
	setEndMarker(HERE, PATH);
	var bounds = GMAP.getBounds();
	if(!bounds.contains(HERE)){
	    GMAP.panTo(HERE);
	}
	if(USINGOS){
	    OSMAP.setCenter(HERE.ospoint, OSMAP.zoom);
	if(USINGLARGEOS){
	    LargeOSMAP.setCenter(HERE.ospoint, LargeOSMAP.zoom);
	}
	}
	plotProfile();
    }
    catch(e){
	error(e, "undo");
    }
}

function editOrRetrieve(){
    if(document.getElementById('editDiv').style.visibility=='visible'){
	return "edit";
    }
    else{
	return "retrieve";
    }
}

function address2location() {
    try{
	var address = document.getElementById("address").value;
	var geocoder = new google.maps.Geocoder();
	geocoder.geocode({ 'address': address}, function(results, status) {
	    if (status == google.maps.GeocoderStatus.OK) {
		var marker = new google.maps.Marker({
		    map: GMAP, 
		    position: results[0].geometry.location
		});
		singleClick(results[0].geometry.location, true);
	    } 
	    else {
		alert("Sorry--I couldn't find" + address);
	    }
	});
    }
    catch(e){
	error(e,  "address2location");
    }
}

function smallcanvasSize(){
    var size = windowSize();
    // size['H'] = size['H']-(document.getElementById("controls").offsetHeight+10);
    size['H'] = size['H']-375;
    size['W'] = size['W']-document.getElementById("GMAP").offsetWidth;
    return size;
}

function osmapHeight(){
    return smallcanvasSize()['H']+'px';
}

function resizeMaps() {
    // calculate new size and apply it
    try{
	var size = gmapSize();
	var gmapDiv = GMAP.div;
	gmapDiv.style.height = size['H']+'px';
	gmapDiv.style.width = size['W']+'px';	
	// trigger a resize event on the map so it reflects the new size
	if(GMAP != null) {
	    google.maps.event.trigger(GMAP, 'resize');
	}
	var profileCanvasDiv = document.getElementById('profileCanvasDiv');
	var oldProfileHeight = profileCanvasDiv.style.height;
	if(USINGOS){
	    var size = smallcanvasSize();
	    var osDiv = document.getElementById('OSMAP');
	    oldOsDivHeight = osDiv.style.height;
	    newOsDivHeight = osmapHeight();
	    if(!(oldOsDivHeight == newOsDivHeight)){
		if(!(oldOsDivHeight=='1px')){
		    osDiv.style.height = newOsDivHeight;
		    OSMAP.updateSize();
		}
		else{
		    profileCanvasDiv.style.height = newOsDivHeight;
		    PROFILECANVAS.height = size['H'];
		    plotProfile();
		}
	    }
	    else{
		PROFILECANVAS.height = size['H'];
		plotProfile();
	    }
	}
    }
    catch(e){
	error(e, "resizeMaps");
    }
}

function point2gpx(point){
    try{
	var marker = point.marker;
	if(marker && !(marker.info == undefined) && !(marker.info.text == undefined)){
	    marker = "  <txt>"+marker.info.text+"</txt>\n"
	}
	else{
	    marker = "";
	}
	if(!(point.elevation == undefined)){
	    elevation = "  <ele>"+point.elevation+"</ele>\n";
	}
	else{
	    elevation = "";
	}
	return "<wpt>\n  <lat>"+point.lat()+"</lat>\n  <lon>"+point.lng()+"</lon>\n"+elevation+marker+"</wpt>\n";
    }
    catch(e){
	error(e, point2gpx);
    }
}

function points2gpx(points){
    try{
	var s = "";
	for(var i=0; i<points.length; i++){
	    s = s+point2gpx(points[i]);
	}
	return s
    }
    catch(e){
	error(e, "point2gpx");
    }
}

function tagRE(tag){
    return new RegExp('<'+tag+'>(.*?)</'+tag+'>', 'g');
}

function createDiv(text){
    var div = document.createElement("div");
    div.style.width = "200px";
    div.style.color = "blue";
    div.innerHTML = text;
    return div;
}

function deselectPath(){
    try{
	if(!(PATH == null)){
	    PATH.polyline.setVisible(false);
	    var points = PATH.points;
	    path = makePath(points, PATH.data.originalColour);
	    path.data.pathLength = PATH.data.pathLength;
	    for(var i=0; i<points.length; i++){
		points[i].path = path;
	    }
	    if(points.length > 0){
		points[0].marker.setZIndex(null);
	    }
	    path.data = PATH.data;
	    if(USINGOS && PATH.osline){
		OSMAP.osvectorlayer.destroyFeatures([PATH.osline]);
		if(USINGLARGEOS){
		    LargeOSMAP.osvectorlayer.destroyFeatures([PATH.osline]);
		}
	    }
	}
    }
    catch(e){
	error(e, "deselectPath");
    }
}

function selectPath(path){
    try{
        deselectPath();
	path.polyline.setVisible(false);
	var points = path.points;
	PATH = makePath(points, BLUE);
	if(USINGOS){
	    drawPathAsOSLine(PATH, BLUE);  
	}
	PATH.data = path.data;
	if(points.length > 0){
	    if(points[0].marker == undefined){
		addMarker(points[0], path.data.name);
	    }
	    points[0].marker.setZIndex(1E9);
	}
	document.getElementById("savePathName").value = path.data.name;
	document.getElementById("downloadName").value = path.data.name.replace(" ", "_");
	zoomToPath(PATH);
	notePath(identity);
    }
    catch(e){
	error(e, "selectPath");
    }
}

/*
 * When you add a marker to a path, you have specify its behaviours.
 *
 * If you click on a marker then you copy whatever is in "pointDescr" to
 * its 'title'.
 *
 * If you go over a marker the 'title' (if there is one) is shown in an
 * infowindow. This gets destroyed when you move away from
 * it. setMouseOver and setMouseOut return 'closures', i.e. functions
 * where the values of the global variables (in this case 'marker') are fixed
 * when the function is constructed rather then when it is run.
 *
 * These interact a bit messily if you want to change the title, because
 * before you can click on it you will have to have moved over it, which
 * will display the old message. We deal with that by closing the info
 * window currently associated with the marker as soon as we get inside
 * doubleClick and then creating a new one. You can change the text
 * inside an info window, and then next time you open it you see the new
 * text. But I want to see the new text immediately: we could do that by
 * closing the infowindow, changing its title, and reopening it. But to
 * do that you'd have to know whether there was one there already, and if
 * not then you'd have to create it. The effort of doing that means that
 * you might as well just kill the current one and open a new one.
 */

function openInfo(marker){
    try{
	if(!(GMAP.getBounds().contains(marker.position))){
	    return;
	}
	var path = marker.position.path;
	pathLength(path);
	pathAscentAndDescent(path,
			     function(){
				 /* 
				  * Lots of fiddly stuff. Include the name and dimensions
				  * if it's the start or end marker, include the attached
				  * text if there is any.
				  */
				 var info = marker.info;
				 var text = info.text;
				 if(text == undefined){
				     text = "";
				     info.text = "";
				 }
				 var details = text;
				 details = pathDetails(marker.position.path);
				 if(!(marker.pt == null) && !(marker.pt.elevation == null)){
				     setScales()
				     details = details+"<br>Elevation "+vscale(marker.pt.elevation);
				 }
				 if(!(text == "")){
				     details = details+"<hr>"+text;
				 }
				 if(!(details == "")){
				     info.content = createDiv(details);
  				     info.open(GMAP, marker);
				 }
			     });
    }
    catch(e){
  	error(e, "openInfo");
    }
}

function closeInfo(marker){
    try{	    
  	marker.info.close();
    }
    catch(e){
  	error(e, "closeInfo");
    }
}

function closeMarker(marker){
    if(!(marker == undefined)){
	marker.setVisible(false);
	marker.info.close();
    }
}

/*
 * Not entirely straightforward: the function returned by setMouseClickMarker is a
 * 'closure', with the CURRENT value of 'marker' built-in when the function 
 * was constructed. Likewise with the others.
 */

function setMouseClickMarker(marker){
    /*
     * What happens when you click on a marker depends on whether it lies on
     * the currently selected path. If it does then you're editing this path, 
     * so your aim in clicking on this marker is to update its info. If it doesn't
     * then clicking on it will make this the current path
     */
    return function(){
	if(marker.position.path == PATH){
  	    try{
		/* When you click on the marker, you're updating its content. At
		 * that point you don't know whether it's currently open or not--
		 * it'll be open if it's not currently blank, because you will 
		 * inevitably have just done a mouseover, which will have tried to
		 * open it. So you should try to close it and then re-open it with
		 * the new content.
		 */
		closeInfo(marker);
  		marker.info.text = document.getElementById('pointDescr').value;
  		openInfo(marker);
		notePath(identity);
  	    }
  	    catch(e){
  		error(e, "setMouseClickMarker");
  	    }
	}
	else{
	    selectPath(marker.position.path);
	}
    }
}

function setMouseOverMarker(marker){
    return function(){
        openInfo(marker);
    }
}

function setMouseOutMarker(marker){
    return function(){
	closeInfo(marker);
    }
}

function addListenersToMarker(marker){
    try{
  	google.maps.event.addListener(marker, 'click', setMouseClickMarker(marker));
    }
    catch(e){
	error(e, "addListener(marker, 'click')");
    }
    try{
  	google.maps.event.addListener(marker, 'mouseover', setMouseOverMarker(marker));
    }
    catch(e){
	error(e, "addListener(marker, 'mouseover')");
    }
    try{
  	google.maps.event.addListener(marker, 'mouseout', setMouseOutMarker(marker));
    }
    catch(e){
	error(e, "addListener(marker, 'mouseout')");
    }	
}

function addMarker(pt, text){
    if(!(text==null)){
	try{
	    var marker = new google.maps.Marker({
      		position: pt,
      		map: GMAP,
	    });
	    /*
	     * When you open a marker, give it an info with a blank
	     * content; then at any subsequent time when you want to
	     * do something with its info, you know it's got one, so
	     * you don't have to keep testing for its existence;
	     */
  	    marker.info = new google.maps.InfoWindow({
    		content: ""
	    });
	    marker.info.text = text;
	    /*
	     * The point needs to know that it's got a marker attached to it
	     */
	    pt.marker = marker;
	}
	catch(e){
	    error(e, "adding info");
	}
	addListenersToMarker(marker);
    }
    return marker;
}

function setProfileMarker(){
    try{
	var marker = new google.maps.Marker({
      	    map: GMAP,
	});
  	marker.info = new google.maps.InfoWindow({
    	    content: ""
	});
    }
    catch(e){
	error(e, "adding info");
    }
    addListenersToMarker(marker);
    return marker;
}

function setEndMarker(point, path){
    try{
	if(path.endMarker == undefined){
	    path.endMarker = new google.maps.Marker({
      		map: GMAP,
	    });
	    path.endMarker.info = new google.maps.InfoWindow({
    		content: "",
		text: "",
	    });
	    addListenersToMarker(path.endMarker);
	}
	path.endMarker.setPosition(point);
    }
    catch(e){
	error(e, "setEndMarker");
    }
}

function gpx2point(wpt){
    try{
    	var lat = tagRE('lat').exec(wpt)[1];
    	var lon = tagRE('lon').exec(wpt)[1];
	var text = tagRE('txt').exec(wpt);
	if(!(text == null)){
	    text = text[1];
	}
	var ele = tagRE('ele').exec(wpt);
	var pt = new google.maps.LatLng(lat, lon);
	if(USINGOS){
	    setOSPoint(pt);
	}
	if(!(ele == null)){
	    pt.elevation = ele[1];
	}
	if(!(text == null)){
	    addMarker(pt, text);
	}
	return pt;
    }
    catch(e){
	error(e, "gpx2point");
    }
}

function gpx2points(s){
    try{
	var points = [];
	var wptTag = tagRE('wpt');
	while(m=wptTag.exec(s)){
    	    points.push(gpx2point(m[1]));
	}
	return points;
    }
    catch(e){
	error(e, "gpx2points");
    }
}

function gpxlist2paths(s){
    try{
	var pathTag = tagRE('path');
	var p;
	var paths = [];
	while(p = pathTag.exec(s)){
    	    p = p[1];
    	    paths.push(p);
	}
	return paths;
    }
    catch(e){
	error(e, "gpxlist2paths");
    }
}

/*
 * Make sure that the copy of the path stored in "path" in the DOM is
 * up-to-date. It's annoying to have to do this every time you make a
 * change to the path, but we need it kept up to date there because at
 * any moment the user might decide to do a refresh, after which we
 * need it in order to redraw the map on the new version. It's also
 * the way that we provide the map to the database operations, but
 * that could probably be done on the fly.
 */

function notePath(contn){
    try{
    	document.getElementById("path").value = points2gpx(PATH.points);
    	document.getElementById("onroad").value = PATH.data.onroad;
    	document.getElementById("offroad").value = PATH.data.offroad;
	document.getElementById("length").value = pathLength(PATH);
	pathAscentAndDescent(PATH,
			     function(){
				 document.getElementById("climb").value = PATH.data.ascent;
				 contn();
			     });
    }
    catch(e){
        error(e, "notePath");
    }
}

function saveRoute(){
    try{
	notePath(function(){
	    var mapform = document.getElementById('mapform');
	    setHiddenAttr('savePath', 'XXX', mapform);
	    setHiddenAttr('circular', PATH.data.circular, mapform);
	    mapform.submit();
	});
    }
    catch(e){
	error(e, "saveRoute");
    }
}
 
function makePath(points, colour){
    try{
	var path = [];
	path.polyline = new google.maps.Polyline({
	    map: GMAP,
	    path: points,
	    strokeColor: colour,
	    strokeOpacity: 1.0,
	    strokeWeight: 5,
	    clickable: false
	});
	path.points = points;
	path.osline = false;
	path.data = [];
	path.data.circular = false;
	if(points.length == 0){
	    path.data.pathLength = 0;
	    path.data.ascent = 0;
	    path.data.descent = 0;
	}
	path.data.name = "";
	path.data.originalColour = colour;
	path.points = points;
	path.data.onroad = 'false';
	path.data.offroad = 'false';
	path.data.contributor = "";
	for(var i=0; i<points.length; i++){
	    var point = points[i];
	    point.path = path;
	    if(!(point.text == undefined)){
		addMarker(point, point.text);
	    }
	}
	if(points.length > 0 && points[0].marker == undefined){
	    addMarker(points[0], path.data.name);
	}
	return path;
    }
    catch(e){
	error(e, "makePath");
    }
}

function newRoute(){
    deselectPath();
    PATH = null;
}

function clearRoute(){
    if(PATH == null){
	return;
    }
    try{
	closeMarker(PATH.endMarker);
    }
    catch(e){
	error(e, "clearRoute (deleting endMarker)");
    }
    try{
	var points = PATH.points;
	for(var i=0; i<points.length; i++){
	    closeMarker(points[i].marker);
	}
    }
    catch(e){
	error(e, "clearRoute (deleting other markers)");
    }
    PATH.polyline.setVisible(false);
    if(USINGSOS && PATH.osline){
	OSMAP.osvectorlayer.destroyFeatures([PATH.osline]);
	if(USINGLARGEOS){
	    LargeOSMAP.osvectorlayer.destroyFeatures([PATH.osline]);
	}
    }
    PATH = null;
}

function extendRoute(){
    try{
	if(PATH == null){
	    selectPath(makePath([], nextColour()));
	}
	var points = PATH.points;
	HERE.internal = false;
	HERE.path = PATH;
    	if(points.length > 0 && chooseRadioButton("useGoogleRoutes").value == "yes"){
	    (new google.maps.DirectionsService()).route({
		origin: points[points.length-1],
		destination: HERE,
		travelMode: google.maps.DirectionsTravelMode.WALKING
	    }, function(result, status) {
		try{
		    var rpoints = result.routes[0].overview_path;
		    for(var i=0; i<rpoints.length; i++){
			var p = rpoints[i];
			p.internal = true;
			p.path = PATH;
			if(USINGOS){
			    setOSPoint(p);
			}
		    }
		    PATH.data.onroad = 'true';
		    points = points.concat(rpoints);
		    points.push(HERE);
		    setEndMarker(points[points.length-1], PATH);
		    saveAndDisplay(points);
		}
		catch(e){
		    error(e, "trying to find route to "+HERE);
		}
	    })}
	else{
	    points.push(HERE);
	    if(points.length == 1){
		addMarker(points[0], PATH.data.name);
	    }
	    setEndMarker(points[points.length-1], PATH);
	    saveAndDisplay(points);
	}	
    }
    catch(e){
	error(e, "extendRoute");
    }
}

function backToStart(){
    try{
	var points = PATH.points;
	if(points.length > 1){
	    var min = distance(HERE, points[0]);
	    var best = -1;
	    for(var i=0; i<points.length-3; i++){
		var d = distance(HERE, points[i]);
		if(d < min){
		    min = d;
		    best = i;
		}
	    }
	    if(min < 50 && best > -1){
		for(var i=best; i > 0; i--){
		    HERE = points[i];
		    extendRoute();
		}
		HERE = points[0];
		extendRoute();
	    }
	    else{
		HERE = points[0];
		singleClick(HERE, true);
	    }
	    PATH.data.circular = true;
	}
    }
    catch(e){
	error(e, "backToStart");
    }
}

/*
 * Add this point to the currently active path. Bit of checking at the start to ensure
 * that the points and path are properly defined. First point in a path automatically
 * gets a marker. Bit of fancy stuff if we're using Google to find the route. 
 *
 * notePath makes sure that the hidden variable on the DOM  has a record
 * of the points that make up the current path.
 */

function saveAndDisplay(points){
    PATH.polyline.setPath(points);
    PATH.points = points;
    if(USINGOS){
	if(PATH.osline){
	    OSMAP.osvectorlayer.destroyFeatures([PATH.osline]);
	    if(USINGLARGEOS){
		LargeOSMAP.osvectorlayer.destroyFeatures([PATH.osline]);
	    }
	}
	drawPathAsOSLine(PATH, BLUE);
    }
    notePath(identity);
}

function singleClick(pt, onGMap){
    try{
	// resizeMaps();
	HERE = pt;
	if(USINGOS){
	    setOSPoint(HERE);
	}
	HERE.text = null;
	extendRoute();
	var bounds = GMAP.getBounds();
	var ne = bounds.getNorthEast();
	var sw = bounds.getSouthWest();
	var width = Math.abs(ne.lng()-sw.lng());
	var height = Math.abs(ne.lat()-sw.lat());
	var x = HERE.lng();
	var y = HERE.lat();
	if(!bounds.contains(HERE)){
	    GMAP.panTo(HERE);
	}
	else if(Math.abs(ne.lng()-x) < width/8 || Math.abs(sw.lng()-x) < width/8 
	   || Math.abs(ne.lat()-y) < height/8 || Math.abs(sw.lat()-y) < height/8){
	    var centre = GMAP.getCenter();
	    var newcentre = new google.maps.LatLng((2*centre.lat()+y)/3, (2*centre.lng()+x)/3);
	    GMAP.panTo(newcentre);
	}
	if(USINGOS && onGMap){
	    OSMAP.setCenter(HERE.ospoint, OSMAP.zoom);
	    if(USINGLARGEOS){
		LargeOSMAP.setCenter(HERE.ospoint, LargeOSMAP.zoom);
	    }
	}
    }
    catch(e){
	error(e, "singleClick");
    }
}

function doubleClick(pt){
    singleClick(pt, true);
    addMarker(pt, "");
}

function better(pt, path1, path2){
    try{
	if(path1 == undefined || path1.length == 0 || path2 == undefined || path2.length == 0){
	    return false;
	}
	else{
	    return (Math.min(distance(pt, path1[0]),
			     distance(pt, path1[path1.length-1]))
		    < Math.min(distance(pt, path2[0]),
			       distance(pt, path2[path2.length-1])));
	}
    }
    catch(e){
	error(e, "better:"+pt+":"+path1+":"+path2+":");
	return false;
    }
}

function insert(pt, path, paths, i, max){
    try{
	if(i == paths.length){
	    if(i < max){
		paths.push(path);
	    }
	}
	else{
	    if(better(pt, path, paths[i])){
		insert(pt, paths[i], paths, i+1, max);
		paths[i] = path;
	    }
	    else{
		insert(pt, path, paths, i+1, max);
	    }
	}
    }
    catch(e){
	error(e, "insert");
    }
}
    
/*
 * If you want to get information into the next instantiation of the DOM by sending it in a POST
 * then you have to add the attributes you want by hand. It's annoying, because it seems that you
 * ought to be able to just set the values of the existing attributes, but that doesn't seem to work
 */
function setHiddenAttr(name, value, mapform){
    var myvar = document.createElement("input");
    myvar.setAttribute('id', name);
    myvar.setAttribute('name', name);
    myvar.setAttribute('type', 'hidden');
    myvar.setAttribute('value', value);
    mapform.appendChild(myvar);
}

function zoomToPath(path){
    var points = path.points;
    if(points.length > 0){
	var maxX = -100000;
	var minX = 100000;
	var maxY = -100000;
	var minY = 100000;
	var midX = 0;
	var midY = 0;
	var n = 0;
	for(var i=0; i<points.length; i++){
	    x = points[i].lat();
	    y = points[i].lng();
	    maxX = Math.max(x, maxX);
	    minX = Math.min(x, minX);
	    maxY = Math.max(y, maxY);
	    minY = Math.min(y, minY);
	    midX = midX+x;
	    midY = midY+y;
	    n = n+1;
	}
	GMAP.panTo(new google.maps.LatLng(midX/n, midY/n));
	GMAP.fitBounds(new google.maps.LatLngBounds(new google.maps.LatLng(maxX, minY),
						    new google.maps.LatLng(minX, maxY)));
	try{
	    if(USINGOS){
		OSMAP.setCenter(points[0].ospoint, OSMAP.zoom);
		if(USINGLARGEOS){
		    LargeOSMAP.setCenter(points[0].ospoint, LargeOSMAP.zoom);
		}
	    }
	}
	catch(e){
	    /* Again, this may not be properly set when map is loaded via retrieve */
	}
    }
}

function readLoadedPaths(){
    try{
	var paths = document.getElementById("paths").value;
	if(paths == ""){
	    PATHS = [];
	}
	else{
	    var maxX = -100000;
	    var minX = 100000;
	    var maxY = -100000;
	    var minY = 100000;
            PATHS = gpxlist2paths(paths);
	    var best3 = [];
	    var points = [];
	    if (PATHS == ""){
		PATHS = [];
	    }
	    try{
		for(var i=0; i<PATHS.length; i++){
		    var path;
		    path = PATHS[i];
		    var name = tagRE('name').exec(path)[1];
		    var contributor = tagRE('contributor').exec(path)[1];
		    points = gpx2points(path);
		    points.name = name;
		    points.contributor = contributor;
		    if(points.length > 0){
			insert(HERE, points, best3, 0, COLOURS.length); 
		    }
		}
	    }
	    catch(e){
		errot(e, " getting paths from PATHS: PATHS = "+PATHS);
		PATHS = [];
		return;
	    }
	    var midX=0;
	    var midY=0;
	    var n = 0;
	    try{
		for(var i=0; i<Math.min(COLOURS.length, best3.length); i++){
		    points = best3[i];
		    var x = points[0].lat();
		    var y = points[0].lng();
		    midX = midX+x;
		    midY = midY+y;
		    for(var j=0; j<points.length; j++){
			x = points[j].lat();
			y = points[j].lng();
			maxX = Math.max(x, maxX);
			minX = Math.min(x, minX);
			maxY = Math.max(y, maxY);
			minY = Math.min(y, minY);
		    }
		    path = makePath(points, nextColour());
		    path.data.name = points.name;
		    path.data.contributor = points.contributor;
		    n = n+1;
		}
	    }
	    catch(e){
		error(e, "adding colours");
	    }
	    if(points.length > 0){
		try{
		    GMAP.panTo(new google.maps.LatLng(midX/n, midY/n));
		    GMAP.fitBounds(new google.maps.LatLngBounds(new google.maps.LatLng(maxX, minY),
								new google.maps.LatLng(minX, maxY)));
		}
		catch(e){
		    error(e, "setting bounds after retrieving routes");
		}
		try{
		    if(USINGOS){
			OSMAP.setCenter(points[0].ospoint, OSMAP.zoom);
			if(USINGLARGEOS){
			    LargeOSMAP.setCenter(points[0].ospoint, LargeOSMAP.zoom);
			}
		    }
		}
		catch(e){
		    /* OSMAP may not be properly initialised if page was loaded via retrieve */
		}
	    }
	    /*
	     * If only one path was retrieved, we might as well select it. If one path was
	     * retrieved then we know that it was in fact path, so we can afford to call
	     * selectPath on it--we know it exists, and we know it's the one we want.
	     */
	    if(PATHS.length == 1){
		selectPath(path);
		plotProfile();
	    }
	}
    }
    catch(e){
	error(e, "in readLoadedPaths");
    }
}

function initialise() {
    try{
	elevator = new google.maps.ElevationService();
	setScales();
	HERE = new google.maps.LatLng(53.2590, -1.9110);
    }
    catch(e){
	error(e, "while getting elevator and setting HERE");
    }
    try{
	xxx = document.getElementById("here").value;
	if(!(xxx == "")){
	    HERE = gpx2point(xxx);
	}
    }
    catch(e){
	error(e, "in conversion of 'here'");
    }
    try{
	if(USINGOS){
	    initOS();
	    setOSPoint(HERE);
	    OSMAP.setCenter(HERE.ospoint, 8);
	    if(USINGLARGEOS){
		LargeOSMAP.setCenter(HERE.ospoint, 8);
	    }
	}
    }
    catch(e){
	error(e, "while initialising OS map");
    }
    try{
	var myOptions = {
	    zoom: 16,
	    center: HERE,
	    mapTypeId: google.maps.MapTypeId.HYBRID,
	    disableDoubleClickZoom: true,
	    draggableCursor: 'auto'
	};
    }
    catch(e){
	error(e, " setting myOptions");
    }
    try{
	GMAP = new google.maps.Map(document.getElementById("GMAP"), myOptions);
	GMAP.div = document.getElementById("GMAP");
    }
    catch(e){
	error(e, "map = new google.maps.Map(document.getElementById('GMAP'), myOptions);");
    }
    try{
	readLoadedPaths();
    }
    catch(e){
	error(e, "in readLoadedPaths");
    }
    PATH = null;
    try{
	x = document.getElementById("path").value;
	if(x){
	    points = gpx2points(x);
	    selectPath(makePath(points, nextColour()));
	    if(points.length > 0 && points[0].marker == undefined){
		addMarker(points[0]);
	    }
	}
    }
    catch(e){
	error(e, ' in document.getElementById("path").value');
    }
    window.onresize = resizeMaps;
    try{
	google.maps.event.addListener(GMAP, 'click', function(event) {
	    try{
		HERE = event.latLng;
		/*
		 * This next bit's tricky. We want to do slightly different things on single or
		 * double clicks. In particular, we want to add the current point to the path on
		 * a single click, and we want to add the current point to the path AND ADD A 
		 * MARKER TO IT on a double click. If you do a double click, then you will be told
		 * about the first click first. So it's a bit awkward to avoid doing what a single
		 * click prompts when you do a double: the solution (from somewhere on the interweb)
		 * is to set a flag when you get the first click. This flag is set to true by the
		 * listener for double clicks. So if you wait a little while before you do anything,
		 * dblclick may get set to true before you try to act. So you can have a look at
		 * it before you actually do anything--if it's still unset then this was just an
		 * isolated click, if it's been reset then it was the first part of a double click.
		 */
	    	dblclick = false;
	    	if(!(editOrRetrieve()=='retrieve')){
	            setTimeout(function(){if(dblclick){doubleClick(HERE)}else{singleClick(HERE, true)}}, 
			       200);
		}
		else{
		    mapform = document.getElementById('mapform');
		    setHiddenAttr('loadPath', 'XXX', mapform);
		    setHiddenAttr('here', point2gpx(HERE), mapform);
		    mapform.submit();   
		}
	    }
	    catch(err){
		error(err, "'google.maps.event.addListener(map, 'click', function(event))'");
	    }
	});
    }
    catch(e){
	error(e, "in google.maps.event.addListener(map, 'click', function(event))");
    }
    try{
	google.maps.event.addListener(GMAP, 'dblclick', function(event) {
	    dblclick = true;
	});
    }
    catch(e){
	error(e, "while setting dblclick listener");
    }
    if(USINGOS){
	chooseDiv('profileCanvasDiv', ['OSMAP', 'profileCanvasDiv'], osmapHeight()); 
    }
}

function windowSize(){
    var winW = 630, winH = 460;
    if (document.body && document.body.offsetWidth) {
	winW = document.body.offsetWidth;
	winH = document.body.offsetHeight;
    }
    if (document.compatMode=='CSS1Compat' &&
	document.documentElement &&
	document.documentElement.offsetWidth ) {
	winW = document.documentElement.offsetWidth;
	winH = document.documentElement.offsetHeight;
    }
    if (window.innerWidth && window.innerHeight) {
	winW = window.innerWidth-10;
	winH = window.innerHeight-10;
    }
    return {"W":winW, "H":winH};
}

var SIDECOLUMNWIDTH = 400;
function gmapSize(){
    var size = windowSize();
    size['W'] = size['W']-SIDECOLUMNWIDTH;
    size['H'] = size['H']-10;
    return size;
}

function mapcanvas(){
    try{
	var size = gmapSize();
	if(USINGLARGEOS){
	    document.write('<div id="LargeOSMAP" style="width:'+size['W']+'px; height: 1px; visibility: hidden"></div>');
	}
	document.write('<div id="GMAP" style="width:'+size['W']+'px; height: '+size['H']+'px; visibility: visible"></div>');
    }
    catch(e){
	error(e, "mapcanvas");
    }
}

function oscanvas(fullsize){
    try{
	var size = smallcanvasSize();
	var height;
	if(fullsize){
	    height = size['H'];
	    visibility = 'visible';
	}
	else{
	    height = 1;
	    visibility = 'hidden';
	}
	document.write('<div id="OSMAP" style="width:'+size['W']+'px; height: '+height+'px; visibility:'+visibility+'"></div>');
    }
    catch(e){
	error(e, "oscanvas");
    }
}

var down = false;
function profileMouseDragged(event){
    try{
	if(down){
	    if(plotProfile()){
		PROFILECTX.strokeStyle = "red";
		var x = Math.round(event.clientX-PROFILECANVAS.getBoundingClientRect().left);
		if(x < 15){
		    x = 15;
		}
		var width = PROFILECANVAS.width;
		if(x > width-15){
		    x = width-15;
		}
		var height = PROFILECANVAS.height;
		drawLine(x, 0.15*height, x, 0.9*height);
		var point = PROFILECANVAS.points[x-15];
		if(point == undefined){
		    return;
		}
		if(PROFILEMARKER == null){
		    PROFILEMARKER = setProfileMarker(point);
		}
		PROFILEMARKER.setPosition(point);
		var info = PROFILEMARKER.info;
		setScales();
		var loc = "Height "+vscale(Math.round(point.elevation));
		var d = point.distanceFromOrigin*PATH.data.pathLength;
		loc = loc+"<br>Distance from start: "+hscale(d);
		loc = loc+"<br>Distance to end: "+hscale(PATH.data.pathLength-d);
		info.content = createDiv(loc);
		info.open(GMAP, PROFILEMARKER);
	    }
	}
    }
    catch(e){
	error(e, "profileMouseDragged");
    }
}

function profileMouseDown(event){
    down = true;
}

function profileMouseUp(event){
    down = false;
    closeMarker(PROFILEMARKER);
    PROFILEMARKER = null;
}

function profileMouseOut(event){
    down = false;
}

function profilecanvas(fullsize){
    try{
	var size = smallcanvasSize();
	var height = size['H'];
	if(fullsize){
	    divheight = height;
	    visibility = 'visible';
	}
	else{
	    divheight = 1;
	    visibility = 'hidden';
	}
	var width = size['W'];
	document.write('<div id="profileCanvasDiv" style="width:'+width+'px; height:'+divheight+'px; visibility: '+visibility+';"><canvas id="profilecanvas" width="'+width+'" height="'+divheight+'"></canvas></div>');
	PROFILECANVAS = document.getElementById('profilecanvas');
	PROFILECANVAS.width = width;
	PROFILECANVAS.height = height;
	PROFILECTX = PROFILECANVAS.getContext("2d"); 
        PROFILECANVAS.addEventListener('mousedown',profileMouseDown, false);
        PROFILECANVAS.addEventListener('mouseup',profileMouseUp, false);
        PROFILECANVAS.addEventListener('mouseout',profileMouseOut, false);
        PROFILECANVAS.addEventListener('mousemove',profileMouseDragged, false);
    }
    catch(e){
	error(e, "profilecanvas");
    }
}

function setOSPoint(pt){
    try{
	pt.ospoint = OSMAP.gridprojection.getMapPointFromLonLat(new OpenLayers.LonLat(pt.lng(), pt.lat()));
	pt.geopoint = new OpenLayers.Geometry.Point(pt.ospoint.getEasting(), pt.ospoint.getNorthing())
    }
    catch(e){
	/*
	 * gridprojection is undefined when you load a new page using 'retrieve',
	 * so have to ignore errors here
	 */
    }
}

// google.maps.event.addDomListener(window, 'load', initialize);
function makeOSMapInDiv(div){
    try{
	var map = new OpenSpace.Map(div);
	map.gridprojection = new OpenSpace.GridProjection();
	map.osvectorlayer = new OpenLayers.Layer.Vector("Vector Layer");
	map.addLayer(map.osvectorlayer);
	map.events.register("click", map, function(e) {
	    try{
		var lonlat = map.gridprojection.getLonLatFromMapPoint(map.getLonLatFromViewPortPx(e.xy));
		singleClick(new google.maps.LatLng(lonlat.lat, lonlat.lon), false);
	    }
	    catch(err){
		error(err, "click on OS map");
	    }
	});
	map.div = document.getElementById(div);
	return map;
    }
    catch(e){
	error(e, makeOSMapInDiv);
    }
}

function initOS(){
    if(!(USINGOS)){
	return;
    }
    OSMAP = makeOSMapInDiv('OSMAP');
    if(USINGLARGEOS){
	LargeOSMAP = makeOSMapInDiv('LargeOSMAP');
	LargeOSMAP.div.style.height = '1px';
	LargeOSMAP.div.style.visibility = 'hidden';
    }
}

function drawPathAsOSLine(path, colour){
    if(!(USINGOS)){
	return;
    }
    try{
	path.osline = makeOSLineFromGPoints(path.points, BLUE);
	if(USINGLARGEOS){
	    LargeOSMAP.osvectorlayer.addFeatures([path.osline]); 
	}
	path.osline = makeOSLineFromGPoints(path.points, BLUE); 
	OSMAP.osvectorlayer.addFeatures([path.osline]); 
    }
    catch(e){
	error(e+" in drawPathAsOSLine");
    }
}

function makeOSLineFromGPoints(gpoints, colour){
    try{
	var ospoints = [];
	for(var i=0; i<gpoints.length; i++){
	    ospoints.push(gpoints[i].geopoint);
	}
	return makeOSLine(ospoints, colour);
    }
    catch(e){
	error(e, "makeOSLineFromGPoints");
    }
}

function makeOSLine(points, colour){
    try{
	var lineString = new OpenLayers.Geometry.LineString(points); 
	var style = {strokeColor: colour, strokeOpacity: 1, strokeWidth: 6}; 
	var lineFeature = new OpenLayers.Feature.Vector(lineString, null, style); 
	lineFeature.lineString = lineString;
	return lineFeature;
    }
    catch(e){
	error(e, "makeOSLine");
    }
}

function drawLine(X0, Y0, X1, Y1){
    try{
	PROFILECTX.beginPath();
	PROFILECTX.moveTo(X0, Y0);
	PROFILECTX.lineTo(X1, Y1);
	PROFILECTX.stroke();
    }
    catch(e){
	error(e, "drawLine");
    }
}

function plotProfile(){
    try{ 
	if(PATH == null){
	    alert('Please select a path (e.g. by clicking on its start or end marker)');
	    return false;
	}
	var points = PATH.points;
	if(points.length < 2){
	    return false;
	}
	var bottom = points[0].elevation;
	var top = bottom;
	for(var i=1; i<points.length; i++){
	    var e = points[i].elevation;
	    if(e < bottom){
		bottom = e;
	    }
	    if(e > top){
		top = e;
	    }
	} 
	var height = PROFILECANVAS.height;
	var width = PROFILECANVAS.width;
        PROFILECTX.fillStyle = "white";
        PROFILECTX.fillRect(0, 0, width, height);
	PROFILECTX.font="10px Times"; 
	var totalLength = points[points.length-1].distanceFromOrigin;
	var totalHeight = top-bottom;
	var bottomMargin = 0.15*height;
	var topMargin = 0.75*height/totalHeight;
        PROFILECTX.fillStyle = "black";
	var bottomLine = (topMargin*totalHeight)+bottomMargin;
	setScales()
	PROFILECTX.fillText(vscale(Math.round(bottom)),10,bottomLine+10);
	var topLine = bottomMargin;
	PROFILECTX.fillText(vscale(Math.round(top)),10,topLine-6);
	var midLine = Math.round((topLine+bottomLine)/2);
	var middle = Math.round((Math.round(top)+Math.round(bottom))/2);
	PROFILECTX.fillText(vscale(middle),10,midLine-6);
        PROFILECTX.strokeStyle = "grey";
	drawLine(0, topLine, width, topLine);
	drawLine(0, bottomLine, width, bottomLine);
	drawLine(0, midLine, width, midLine);
	var lastX = -1;
	var lastY = (topMargin*(top-points[0].elevation))+bottomMargin;;
        PROFILECTX.strokeStyle = "blue";
	PROFILECANVAS.points = [];
	width = width-40;
	for(var i=0; i<points.length; i++){
	    currentX = Math.round(points[i].distanceFromOrigin*width);
	    elevation = points[i].elevation;
	    currentY = (topMargin*(top-elevation))+bottomMargin;
	    drawLine(lastX+15, lastY, currentX+15, currentY);
	    for(var j=lastX; j<currentX; j++){
		PROFILECANVAS.points.push(points[i]);
	    }
	    lastY = currentY;
	    lastX = currentX;
	}
        PROFILECTX.fillStyle = "red";
	PROFILECTX.font="14px Times"; 
	PROFILECTX.fillText("Drag the mouse in this window to project heights onto the route",10,topLine-23);
	return true;
    }
    catch(e){
	error(e, "plotProfile");
	return false;
    }
}
