<!DOCTYPE html>
<html>
  <head>
<meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
  <style type="text/css">
  html { height: 100% }
body { height: 100%; margin: 0; padding: 0}
map_canvas { height: 100% }
</style>
<script type="text/javascript"
  src="http://maps.googleapis.com/maps/api/js?key=AIzaSyDOszqkxLodS_dL2NmuquxGqZVK3G_VnUM&sensor=true&libraries=geometry">
  </script>
  <script type="text/javascript"
  src="http://openspace.ordnancesurvey.co.uk/osmapapi/openspace.js?key=CE9B85538994100AE0405F0AC8601AFA">
  </script>
  <script type="text/javascript" src="tooltip.js">
  </script>
  <script type="text/javascript" src="map4.js">
  </script>
  <link href="./buxtonseniors.css" rel="stylesheet" type="text/css" />
  </head>
  <body>
  <form method="post" action="map4.php" id="mapform">
  <table>
<tr>
<td style="vertical-align:top; cursor: auto">
  <script type="text/javascript">
try{
  mapcanvas();
}
catch(e){
  alert(e);
}
</script>
</td>
<td style="vertical-align:top">
<script type="text/javascript">
  /* If you swap the order in which profilecanvas and oscanvas are
   * loaded, you must swap the values of false and true--the one that
   * is loaded SECOND is the one that you want to have displayed
   * fullsize.
   */
  if(USINGOS){
    profilecanvas(false);
    oscanvas(true);
  }
  else{
    profilecanvas(true);
  }
</script>
<div id="controls">
<!--
<input type="button" id="switchMainMap" value="Switch main window to OS map" onclick="try{switchMainMaps()}catch(e){alert(e)}">
-->

<input type="button" id="switchSmallWindow" value="Small window is currently showing elevation--switch to OS map" onclick="try{switchSmallMaps()}catch(e){alert(e)};">
<br>
  <a href="cgi-bin/map4Guidelines.py"><b>How to use the route finder</b></a>
  <br>
  <a href="cgi-bin/seniors.py"><b>Buxton AC seniors home page</b></a>
  <br>
  <input type="submit" name="gps" value="GPS upload and download">
  <br>
  <input type='radio' name='mode' id='retrieveButton' value='retrieveDiv' onclick="chooseDiv('retrieveDiv', ['retrieveDiv', 'editDiv', 'listDiv'], '180px');"/><b>Search for route</b>
  <input type='radio' name='mode' id='listButton' value='listDiv' onclick="chooseDiv('listDiv', ['retrieveDiv', 'editDiv', 'listDiv'], '180px');"/><b>List all routes</b>
<input type='radio' name='mode' id='editButton' value='editDiv' onclick="chooseDiv('editDiv', ['retrieveDiv', 'editDiv', 'listDiv'], '180px');"/>  <b>Create route</b>
<div id="general">
  <hr id="separator">
  Imperial (miles, feet)<input type="radio" name="measures" value="miles,feet" checked onclick="setScales();">
  Metric (km, metres)<input type="radio" name="measures" value="km,metres" onclick="setScales();">
  <input type='hidden' name='hscale' id='hscale' value='' >  <input type='hidden' name='vscale' id='vscale' value='' >  <br><input type="button" name="getLocation" id="getLocation" 
  value="find location (place name or postcode)" onclick="address2location()">
  <input type="text" name="address" id="address" 
  onkeydown="if(event.keyCode == 13){try{address2location()}catch(e){alert(e)}}">
  <br>
  You are not currently logged in<hr id="separator">
  </div>
  
  <div id="retrieveDiv" style="visibility:hidden; height:1px">
  To find a route, fill in any of the details below that you want and then click on the map near 
  where you'd like your route to begin.
<p>
    route name<input type='text' name='loadPathName' id='loadPathName' value='' >    <br>
    contributed  by <input type='text' name='contributor' id='contributor' value='' >    <br>
    Min length <input type='text' name='minLength' id='minLength' value='' size="3">    Max length <input type='text' name='maxLength' id='maxLength' value='' size="3">    <br>
    Min climb <input type='text' name='minClimb' id='minClimb' value='' size="4">    Max climb <input type='text' name='maxClimb' id='maxClimb' value='' size="4">    <br>
    on road <input type="radio" name="onOrOffRoad" id="onOrOffRoad" value="onRoad">, 
    off road<input type="radio" name="onOrOffRoad" id="onOrOffRoad" value="offRoad">, 
    mixed <input type="radio" name="onOrOffRoad" id="onOrOffRoad" value="mixed">, 
    don't care<input type="radio" name="onOrOffRoad" id="onOrOffRoad" value="don't care" checked>
  <br>
  circular route <input type="checkbox" name="circular" value="yes" /> 
  </div>
  
  <div id="editDiv" style="visibility:visible; height:200px">
  <input type='hidden' name='loggedInAs' id='loggedInAs' value='' >  Route name: <input type='text' name='savePathName' id='savePathName' value='' >  <br>
  <button type="button" name="savePath" id="savePath" onclick="saveRoute();">save route</button>
  <input type="submit" name="deletePath" id="deletePath" value="delete route"</input>
  <br>Describe point 
  <br><textarea rows="3" cols="40" name="pointDescr" id="pointDescr"></textarea>
  <br>Follow road (includes some footpaths): 
  no <input type="radio" name="useGoogleRoutes" value="no" checked/> 
  yes <input type="radio" name="useGoogleRoutes" value="yes"/> 
  <br><button type="button" onclick="undo();">undo</button>
  <button type="button" onclick="backToStart();">back to start</button>
  <button type="button" onclick="clearRoute();">clear route</button>
  <button type="button" onclick="newRoute();">start new route</button>
</div>

<div id="debugging" style="visibility: hidden; height:1px">
  <p>
  <b>Hidden variables (for passing information out)</b>
  <br>HERE<input type="text" width="30" name="here" id="here" value="">
  <br>PATH<input type="text" width="30" name="path" id="path" value="">
  <br>PATHS<input type="text" width="30" name="paths" id="paths" value="">
  <br>DOWNLOADNAME<input type="text" width="30" name="downloadName" id="downloadName" value="">
  <br>ONROAD<input type="text" width="30" name="onroad" id="onroad" value="">
  <br>OFFROAD<input type="text" width="30" name="offroad" id="offroad" value="">
  <br>length of path<input type="text" id="length" name="length" value="0">
  <br>climb<input type="text" id="climb" name="climb" value="0">
  </div>
  </form>
  </div>

  <div id="listDiv" style="visibility: hidden; height: 1px">
    Click on a route to see it, or select several checkboxes and press
  <input type="submit" name="loadList" value="submit"> to view the ones you've chosen
  <br>
  <table class="routes">
  <tr class='routes'><td><small><form method='get'><input type='submit' value='Dream On Mile' style='font-size:8px'><input type='hidden' name='loadPath' value='Dream On Mile'><input type='hidden' name='loadPathName' value='Dream On Mile'> </form></small></td><td class='routes'><small>Mark Pursell</small></td><td class='routes'><small> 1.0</small></td><td class='routes'><small> 29.9</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Dream On Mile:Mark Pursell'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Pavilion Gardens 5K' style='font-size:8px'><input type='hidden' name='loadPath' value='Pavilion Gardens 5K'><input type='hidden' name='loadPathName' value='Pavilion Gardens 5K'> </form></small></td><td class='routes'><small>Allan Ramsay</small></td><td class='routes'><small> 1.2</small></td><td class='routes'><small> 48.0</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Pavilion Gardens 5K:Allan Ramsay'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Shutlinsloe' style='font-size:8px'><input type='hidden' name='loadPath' value='Shutlinsloe'><input type='hidden' name='loadPathName' value='Shutlinsloe'> </form></small></td><td class='routes'><small>Ros Barrett</small></td><td class='routes'><small> 3.3</small></td><td class='routes'><small> 857.5</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Shutlinsloe:Ros Barrett'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Buxton Carnival 4' style='font-size:8px'><input type='hidden' name='loadPath' value='Buxton Carnival 4'><input type='hidden' name='loadPathName' value='Buxton Carnival 4'> </form></small></td><td class='routes'><small>Allan Ramsay</small></td><td class='routes'><small> 4.0</small></td><td class='routes'><small> 295.4</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Buxton Carnival 4:Allan Ramsay'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Buxton Hilly' style='font-size:8px'><input type='hidden' name='loadPath' value='Buxton Hilly'><input type='hidden' name='loadPathName' value='Buxton Hilly'> </form></small></td><td class='routes'><small>Allan Ramsay</small></td><td class='routes'><small> 4.3</small></td><td class='routes'><small> 671.1</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Buxton Hilly:Allan Ramsay'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Shining Tor/Kings' Clough' style='font-size:8px'><input type='hidden' name='loadPath' value='Shining Tor/Kings' Clough'><input type='hidden' name='loadPathName' value='Shining Tor/Kings' Clough'> </form></small></td><td class='routes'><small>Sheila Bradley</small></td><td class='routes'><small> 4.4</small></td><td class='routes'><small> 781.5</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Shining Tor/Kings' Clough:Sheila Bradley'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='The Boardwalk Run' style='font-size:8px'><input type='hidden' name='loadPath' value='The Boardwalk Run'><input type='hidden' name='loadPathName' value='The Boardwalk Run'> </form></small></td><td class='routes'><small>Sheila Bradley</small></td><td class='routes'><small> 4.5</small></td><td class='routes'><small> 524.4</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='The Boardwalk Run:Sheila Bradley'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Carnival 5' style='font-size:8px'><input type='hidden' name='loadPath' value='Carnival 5'><input type='hidden' name='loadPathName' value='Carnival 5'> </form></small></td><td class='routes'><small>Ros Barrett</small></td><td class='routes'><small> 5.0</small></td><td class='routes'><small> 471.4</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Carnival 5:Ros Barrett'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Shining Tor/Lamaload/Jenkin Chapl' style='font-size:8px'><input type='hidden' name='loadPath' value='Shining Tor/Lamaload/Jenkin Chapl'><input type='hidden' name='loadPathName' value='Shining Tor/Lamaload/Jenkin Chapl'> </form></small></td><td class='routes'><small>Sheila Bradley</small></td><td class='routes'><small> 5.6</small></td><td class='routes'><small> 1060.2</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Shining Tor/Lamaload/Jenkin Chapl:Sheila Bradley'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Roaches Summer Series Race' style='font-size:8px'><input type='hidden' name='loadPath' value='Roaches Summer Series Race'><input type='hidden' name='loadPathName' value='Roaches Summer Series Race'> </form></small></td><td class='routes'><small>Allan Ramsay</small></td><td class='routes'><small> 5.8</small></td><td class='routes'><small> 849.9</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Roaches Summer Series Race:Allan Ramsay'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Goyt Valley Classic' style='font-size:8px'><input type='hidden' name='loadPath' value='Goyt Valley Classic'><input type='hidden' name='loadPathName' value='Goyt Valley Classic'> </form></small></td><td class='routes'><small>Steven Ramsay</small></td><td class='routes'><small> 5.9</small></td><td class='routes'><small> 1001.4</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Goyt Valley Classic:Steven Ramsay'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Taxal Run' style='font-size:8px'><input type='hidden' name='loadPath' value='Taxal Run'><input type='hidden' name='loadPathName' value='Taxal Run'> </form></small></td><td class='routes'><small>Sheila Bradley</small></td><td class='routes'><small> 6.3</small></td><td class='routes'><small> 684.4</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Taxal Run:Sheila Bradley'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Half Taxal Run' style='font-size:8px'><input type='hidden' name='loadPath' value='Half Taxal Run'><input type='hidden' name='loadPathName' value='Half Taxal Run'> </form></small></td><td class='routes'><small>Sheila Bradley</small></td><td class='routes'><small> 6.3</small></td><td class='routes'><small> 697.2</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Half Taxal Run:Sheila Bradley'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Leg it around Lathkill' style='font-size:8px'><input type='hidden' name='loadPath' value='Leg it around Lathkill'><input type='hidden' name='loadPathName' value='Leg it around Lathkill'> </form></small></td><td class='routes'><small>Allan Ramsay</small></td><td class='routes'><small> 7.0</small></td><td class='routes'><small> 932.8</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Leg it around Lathkill:Allan Ramsay'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Club Night:2/0/2013' style='font-size:8px'><input type='hidden' name='loadPath' value='Club Night:2/0/2013'><input type='hidden' name='loadPathName' value='Club Night:2/0/2013'> </form></small></td><td class='routes'><small>Allan Ramsay</small></td><td class='routes'><small> 7.0</small></td><td class='routes'><small> 932.8</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Club Night:2/0/2013:Allan Ramsay'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Leg it round Lathkil' style='font-size:8px'><input type='hidden' name='loadPath' value='Leg it round Lathkil'><input type='hidden' name='loadPathName' value='Leg it round Lathkil'> </form></small></td><td class='routes'><small>Allan Ramsay</small></td><td class='routes'><small> 7.2</small></td><td class='routes'><small> 0.0</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Leg it round Lathkil:Allan Ramsay'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Staffs Moorlands xmas cracker' style='font-size:8px'><input type='hidden' name='loadPath' value='Staffs Moorlands xmas cracker'><input type='hidden' name='loadPathName' value='Staffs Moorlands xmas cracker'> </form></small></td><td class='routes'><small>Ros Barrett</small></td><td class='routes'><small> 8.1</small></td><td class='routes'><small> 1097.6</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Staffs Moorlands xmas cracker:Ros Barrett'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Combes Circular' style='font-size:8px'><input type='hidden' name='loadPath' value='Combes Circular'><input type='hidden' name='loadPathName' value='Combes Circular'> </form></small></td><td class='routes'><small>Joanne Cudahy</small></td><td class='routes'><small> 8.3</small></td><td class='routes'><small> 1338.8</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Combes Circular:Joanne Cudahy'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Sudeley Castle circular' style='font-size:8px'><input type='hidden' name='loadPath' value='Sudeley Castle circular'><input type='hidden' name='loadPathName' value='Sudeley Castle circular'> </form></small></td><td class='routes'><small>Allan Ramsay</small></td><td class='routes'><small> 8.4</small></td><td class='routes'><small> 867.9</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Sudeley Castle circular:Allan Ramsay'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Cloud 9' style='font-size:8px'><input type='hidden' name='loadPath' value='Cloud 9'><input type='hidden' name='loadPathName' value='Cloud 9'> </form></small></td><td class='routes'><small>Mark Pursell</small></td><td class='routes'><small> 8.7</small></td><td class='routes'><small> 1055.5</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Cloud 9:Mark Pursell'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Fletcher Cup' style='font-size:8px'><input type='hidden' name='loadPath' value='Fletcher Cup'><input type='hidden' name='loadPathName' value='Fletcher Cup'> </form></small></td><td class='routes'><small>Allan Ramsay</small></td><td class='routes'><small> 9.4</small></td><td class='routes'><small> 1216.2</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Fletcher Cup:Allan Ramsay'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Howden and Derwent Reservoirs' style='font-size:8px'><input type='hidden' name='loadPath' value='Howden and Derwent Reservoirs'><input type='hidden' name='loadPathName' value='Howden and Derwent Reservoirs'> </form></small></td><td class='routes'><small>Newseditor</small></td><td class='routes'><small> 11.9</small></td><td class='routes'><small> 2268.6</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Howden and Derwent Reservoirs:Newseditor'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Edale Derwent MTB ride' style='font-size:8px'><input type='hidden' name='loadPath' value='Edale Derwent MTB ride'><input type='hidden' name='loadPathName' value='Edale Derwent MTB ride'> </form></small></td><td class='routes'><small>Allan Ramsay</small></td><td class='routes'><small> 11.9</small></td><td class='routes'><small> 2268.6</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Edale Derwent MTB ride:Allan Ramsay'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Extension of Fletcher Cup route' style='font-size:8px'><input type='hidden' name='loadPath' value='Extension of Fletcher Cup route'><input type='hidden' name='loadPathName' value='Extension of Fletcher Cup route'> </form></small></td><td class='routes'><small>Ros Barrett</small></td><td class='routes'><small> 12.3</small></td><td class='routes'><small> 1419.2</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Extension of Fletcher Cup route:Ros Barrett'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Buxton half marathon' style='font-size:8px'><input type='hidden' name='loadPath' value='Buxton half marathon'><input type='hidden' name='loadPathName' value='Buxton half marathon'> </form></small></td><td class='routes'><small>Allan Ramsay</small></td><td class='routes'><small> 13.1</small></td><td class='routes'><small> 1508.4</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Buxton half marathon:Allan Ramsay'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Howden and Derwent Reservoirs' style='font-size:8px'><input type='hidden' name='loadPath' value='Howden and Derwent Reservoirs'><input type='hidden' name='loadPathName' value='Howden and Derwent Reservoirs'> </form></small></td><td class='routes'><small>Raceeditor</small></td><td class='routes'><small> 15.1</small></td><td class='routes'><small> 1091.8</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Howden and Derwent Reservoirs:Raceeditor'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Training run on Tissington trail' style='font-size:8px'><input type='hidden' name='loadPath' value='Training run on Tissington trail'><input type='hidden' name='loadPathName' value='Training run on Tissington trail'> </form></small></td><td class='routes'><small>Ros Barrett</small></td><td class='routes'><small> 15.6</small></td><td class='routes'><small> 981.1</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Training run on Tissington trail:Ros Barrett'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Waterswallows and Combs' style='font-size:8px'><input type='hidden' name='loadPath' value='Waterswallows and Combs'><input type='hidden' name='loadPathName' value='Waterswallows and Combs'> </form></small></td><td class='routes'><small>Ros Barrett</small></td><td class='routes'><small> 18.2</small></td><td class='routes'><small> 912.8</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Waterswallows and Combs:Ros Barrett'></td></tr><tr class='routes'><td><small><form method='get'><input type='submit' value='Rough stuff bike ride' style='font-size:8px'><input type='hidden' name='loadPath' value='Rough stuff bike ride'><input type='hidden' name='loadPathName' value='Rough stuff bike ride'> </form></small></td><td class='routes'><small>Allan Ramsay</small></td><td class='routes'><small> 19.9</small></td><td class='routes'><small> 2617.5</small></td><td class='routes'> <input type='checkbox' name='listitem[]' value='Rough stuff bike ride:Allan Ramsay'></td></tr>  </table>
  </div>

  </td>
  </tr>
  </table>
  </div>

<input type="hidden" id="mode" value="editDiv">

<script type="text/javascript">
  try{
    chooseMode();
  }
catch(e){
  error(e, "chooseMode (in PHP)");
}
</script>
  <script type="text/javascript">
  try{
  initialise();
}
catch(e){
  alert(e+' in initialise');
}
</script>
</body>
</html>