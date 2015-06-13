var SmokeEffect = {
  
  imgLocation: "http://freevectorfinder.com/images/thums/cloud_clip_art_16279.jpg", //url to image here
  smokeWidth: 80, //standard width
  smokeHeight: 45, //standard height
  
  //don't touch this:
  smokePos: new Array(),
    
  makeEffect: function(id, posX, posY) {
    //set position from the "parent"
    SmokeEffect.smokePos[id] = new Array();
    SmokeEffect.smokePos[id]['x'] = posX;
    SmokeEffect.smokePos[id]['y'] = posY;
    
    //set a random time to start puffing
    var time = 1;
    setTimeout("SmokeEffect.animate('" + id + "')", time);
  },
  
  animate: function(id) {

    //create the smoke cloud
    var puff = document.createElement("IMG");
    $(puff).attr("src", SmokeEffect.imgLocation);
    $(puff).attr("alt", "puff");
    $(puff).attr("class", "puff");
    
    //create a temp id for the cloud so we can delete it later on
    var tempId = "puff" + Math.floor(Math.random()*1001);
    $(puff).attr("id", tempId);
    
    //append the cloud to the body
    $(document.body).append($(puff));
    
    var objPos = $('#' + id).offset();
    
    //do smoke animation
    $(puff).css({
      top: (objPos['top'] + SmokeEffect.smokePos[id]['y']) + "px",
      left: (objPos['left'] + SmokeEffect.smokePos[id]['x']) + "px",
      zIndex: 25,
      opacity: 0.4
    });
    $(puff).animate({
      width: SmokeEffect.smokeWidth + "px",
      height: SmokeEffect.smokeHeight + "px",
      marginLeft: "-" + (SmokeEffect.smokeWidth / 2) + "px",
      marginTop: "-" + (SmokeEffect.smokeHeight * 1.5) + "px",
      opacity: 0.9
    },{
      duration: 100
    }).animate({
      marginTop: "-" + (SmokeEffect.smokeHeight * 3.5) + "px",
      opacity: 0.0
    },{
      duration: 1000
    });
    
    //create timeout and run the animation again
    //var time = 5500 + (Math.floor(Math.random()*4501));
    
   // setTimeout("SmokeEffect.animate('" + id + "')", time);
    
    //remove the old one
    setTimeout("$('#" + tempId + "').remove()", 4000);
    
  }
}
path = require('path');
var serialport = require(path.join(process.cwd(),"../node_modules/serialport"));
var SerialPort = serialport.SerialPort;
var fs = require('fs');
var vapes = [];
var user = {};
var vapeStats = {};
var newVapeStats = {};
// API configuration data (To be put into a json file)
var config = {
  apiversion: "2.1",
  time_header: "T",
  time_request: 7,
  target_header: "A",
  vapes_header: "B",
  vape_filter: false,
  vape_duration_cutoff : 500,
  constants : {
    // Nicotine absorbed from a weak cigarette in ng/ml
    weakCigaretteNicotine: 2.10,
    // Nicotine absorbed from a strong cigarette in ng/ml
    strongCigaretteNicotine: 18.8,
    // Nicotine absorbed from one seconds of using an ecigarette in ng/ml
    nicotinePerSecondVape: 0.175
  }
};
// Start point
$(document).ready(function(){
  // Checks for existing user config
  fs.readFile('user_data/user_config.json', "utf8", function(err, data) {
    if (err) {
      // Loads new user screen
      hideSplash();
      showHeader();
      $('#name').fadeIn();
      // Shows name and cigarettes smoked user inputs
      $('#name > button').click(function(){ 
        $('#name').hide();
      });
    } else {
      // If users file exists
      user = JSON.parse(data);
      hideSplash();
      showHeader();
      // reads file
      fs.readFile('user_data/vape_log.json', 'utf8', function(err, data){
        if (err){
          console.log("no vape log, one will be created!");
        } else {
          // Parses json vapes into vapes array and fire target calculation
          vapes = JSON.parse(data);
          calculateVapeStats(vapes);
          $('#dash').html("<h1>" + vapeStats.puffsToday + "</h1><div id='smokeSpawnPoint'></div><h4>puffs</h4><button id='showTargets' data-label='Targets'>Targets</button><br/><br/><button id='showStats' data-label='Statistics'>Statistics</button>");
          $('button#showTargets').click(showGraphs());
          $('button#showStats').click(showStats());
          $('button#showStats').click(showDash());
        }
      });
    }
    /// Connects to quit stik
    connectToQuitstik(user);  
  });
});
// UI manipulation functions
function hideSplash() { $('#splash').hide();}
function showHeader() { $('#header').fadeIn();}
function hideHeader() { $('#header').hide();}
function showQuitStik() { $('#dash').hide(); $('#number').hide(); $('#graphs').hide(); $('#quitstik').fadeIn()}
function showGraphs() {  $('#dash').hide(); $('#numbers').hide(); $('#graphs').fadeIn();showWeeklyVapesGraph();showTargetGraph();}
function showDash() {  $('#graphs').hide(); $('#numbers').hide(); $('#dash').fadeIn();}
function showStats() { 
  $('#dash').hide(); 
  $('#graphs').hide(); 
  $('#numbers').fadeIn();         
  $('#todays').html("<li>Todays</li><li>" + Math.round(vapeStats.todaysCigarettes) + " <z>Cigarettes </z></li><li>" + Math.round(vapeStats.todaysNicotineAbsorbed, 1) + " <z>ug/mg Nicotine</z> </li><li>" + Math.round(vapeStats.puffsToday) + " <z>Puffs</z> </li>");
  $('#target').html("<li>Target</li><li>" + Math.round(vapeStats.targetCigarettesDaily) + " <z>Cigarettes</z> </li><li>" + Math.round(vapeStats.targetNicotineAllowance, 1) + " <z>ug/mg Nicotine</z> </li><li>" + Math.round(vapeStats.targetPuffs) + " <z>Puffs</z> </li>");
}

function connectToQuitstik(user) {
  
  serialport.list(function (err, ports) {
    var i = 0;
    ports.forEach(function(port, ports) {
      //Lists com ports of host
      $('#comPorts').append("<option value='" + i + "'> " + port.comName + "</option>");
      i++;
    }); 
    $('#connect').click(function(){
      // Connects to selected port
      connectToPort($('#comPorts option:selected').val(), ports);
      $('#quitstik').hide();
    });
    if(user.comPort){
      // connects to saved port
      connectToPort(parseInt(user.comPort), ports);
    } else { 
      showQuitStik();
    }
  });
}

function connectToPort(port_i, ports){ 
  $('#connect').html("<p> Connecting to " + ports[port_i].comName + "</p>");
  var quitStik = new SerialPort(ports[port_i].comName, {
    // serial config
    baudRate: 9600,
    parser: serialport.parsers.readline("\r\n")
  })
  if (quitStik === undefined){ connectToQuitstik(user.comPort = false); return false }
    quitStik.on("open", function () {
      sendTarget(quitStik);
      sendVapes(quitStik);
      user.comPort = port_i;
      if ($('#name > input').val() == "") {
        user.fullName = user.fullName;
        user.originalCigarettesDaily = user.originalCigarettesDaily;
      } else {
        user.fullName = $('#name > input').val();
        user.originalCigarettesDaily = $('#name > #cigs > input').val();
      }
      fs.writeFile("user_data/user_config.json", JSON.stringify(user, null, 2), function(err) {
      if(err) {
        return console.log(err);
      }
        console.log("The file was saved!");
      });
      $('#connectedStatus > img ').attr("src", "images/connected_icon.PNG");
      $('#dash').show();
      quitStik.on("data", function (data) {
        var receivedAt = new Date();
        console.log(data);
        // checks for data calls from arduino
        if(parseInt(data) === 7){
          sendTime(quitStik);
          return false;
        }
        if(parseInt(data) === 8){
          sendTarget(quitStik);
          return false;
        }
        if(parseInt(data) === 9){
          sendVapes(quitStik);
          return false;
        }
        // Ignores false vapes (shorter that config.vape_duration_cutoffms)
        console.log(parseInt(data.split(",")[0]) > config.vape_duration_cutoff);
        if(parseInt(data.split(",")[0]) > config.vape_duration_cutoff){  
          // Checks if date is before 2014
          if(new Date(String(data.split(",")[1])) < 1356998400){
            // sets new date
            var vapedAt = new Date();
            // Sends time to quitstik
            sendTime(quitStik);
          } else 
          if(new Date(String(data.split(",")[1])) > 1356998400){
            // Converts datetime to epoch
            var vapedAt = new Date(String(data.split(",")[1])); 
          } else {
            return false;
          }
          var vape = {
            // vape object
            "duration" : data.split(",")[0],
            "vapedAt"  : vapedAt,
            "receivedAt" : receivedAt
          };
          //adds to vapes array
          vapes.push(vape);
          // Fires recalculation of vape statistics -- TODO: "update" arrays to ease cpu use
          calculateVapeStats(vapes);
          // Displays smoke puff
          SmokeEffect.makeEffect("smokeSpawnPoint", config.vape_duration_cutoff, 30);
          //
          $('.graphContainer > h1').text(vapeStats.puffsToday);
          $('#dash').html("<h1>" + parseInt(vapeStats.puffsToday) + "</h1><div id='smokeSpawnPoint'></div><h4>puffs</h4><button id='showTargets' data-label='Targets'>Targets</button><br/><br/><button id='showStats' data-label='Statistics'>Statistics</button>");
          
          $('button#showTargets').click(function(){
            showGraphs();
          });
          $('button#showStats').click(function(){
            showStats();
          });
          if (window.targetGraph) {
            //window.targetGraph.segments[0].value = vapeStats.puffsToday;
            //window.targetGraph.update();
            showWeeklyVapesGraph();
          } 
        }
      }
    );
  });
};
function getLastFiveDays(vapes) {
  var today = new Date();
  var first = today.getDate() - (today.getDay() - 1);
  var last = first - 5;
  var firstDay = new Date(today.setDate(first));
  var lastDay = new Date(today.setDate(last));
  var lastFiveDaysVapes = [];
  for(var i = 0; i < vapes.length; i++){
    if(new Date(vapes[i].vapedAt) >= lastDay){
      if(new Date(vapes[i].vapedAt) <= firstDay){
        lastFiveDaysVapes.push(vapes[i]);
      }
    }
  }
  return lastFiveDaysVapes;
}
function getThisWeeks(vapes){
  // Gets todays epoch
  var today = new Date();
  // gets difference between last + first day
  var first = today.getDate() - today.getDay();
  var last = first - 7;
  // Gets epoch for first and last day
  var firstDay = new Date(today.setDate(first));
  var lastDay = new Date(today.setDate(last));
  // Array for this weeks vapes
  var currWeeksVapes = [];
  // Loads all vapes from this week into currWeeksVapes array
  for(var i = 0; i < vapes.length; i++){
    if(new Date(vapes[i].vapedAt) >= lastDay){
      currWeeksVapes.push(vapes[i]);
    } 
  }
  // Returns an array of this weeks vapes
  return currWeeksVapes; 
}
function getThisDays(vapes) { 
  // Gets todays epoch
  var today = new Date();
  // gets difference between last + first day
  var first = today.getDate() - today.getDay();
  var last = first - 1;
  // Gets epoch for first and last day
  var firstDay = new Date(today.setDate(first));
  var lastDay = new Date(today.setDate(last));
  // Array for this weeks vapes
  var currDaysVapes = [];
  // Loads all vapes from this week into currWeeksVapes array
  for(var i = 0; i < vapes.length; i++){
    if(new Date(vapes[i].vapedAt) >= lastDay){
      currDaysVapes.push(vapes[i]);
    } 
  }
  return currDaysVapes; 
}
// This function calculates all the related vaping stats
function calculateVapeStats(vapes) {
  if(vapes.length <= 0) {return}
  var currDaysVapes = getThisDays(vapes);
  var currWeeksVapes = getThisWeeks(vapes);
  var lastFiveDaysVapes = getLastFiveDays(vapes);
  var vapeFilter
  // For the total time spent vaping over period
  // Duration in ms of today
  var todaysVapingDuration = 0;
  // Duration in ms of last seven days vaping
  var weeksVapingDuration = 0;
  // Duration in ms of last five days (starting yesterdday)
  var lastFiveDaysVapingDuration = 0;
  // Loops through vapes and totals duration
  for (var i = 1, l = currDaysVapes.length; i < l; i++){
    if(new Date(currDaysVapes[i].vapedAt).toDateString() === Date.today().toDateString()){
      if(isNaN(parseInt(currWeeksVapes[i].duration)) === false) {  
        if(config.vapeFilter) {
          if(parseInt(currWeeksVapes[i].duration >= config.vape_duration_cutoff)){
            todaysVapingDuration = todaysVapingDuration + (parseInt(currDaysVapes[i].duration) || 0);
          }
        } else {
          todaysVapingDuration = todaysVapingDuration + (parseInt(currDaysVapes[i].duration) || 0);
        }
      }
    }
  }// Loops through weeks vapes and calculates totals
  for (var i = 1, l = currWeeksVapes.length; i < l; i++){
    if(isNaN(parseInt(currWeeksVapes[i].duration)) === false) {
      if(config.vapeFilter){ 
        if(parseInt(currWeeksVapes[i].duration >= config.vape_duration_cutoff)){   
          weeksVapingDuration = weeksVapingDuration + (parseInt(currWeeksVapes[i].duration) || 0); 
          if(new Date(currWeeksVapes[i].vapedAt).toDateString() === Date.today().toDateString()){
            todaysVapingDuration = todaysVapingDuration + (parseInt(currWeeksVapes[i].duration) || 0);
          }
        }
      } else {
        weeksVapingDuration = weeksVapingDuration + (parseInt(currWeeksVapes[i].duration) || 0); 
        if(new Date(currWeeksVapes[i].vapedAt).toDateString() === Date.today().toDateString()){
          todaysVapingDuration = todaysVapingDuration + (parseInt(currWeeksVapes[i].duration) || 0);
        }
      }
    } 
  }// loops through last five days vapes and calulates totals
  for (var i = 1, l = lastFiveDaysVapes.length; i < l; i ++){
    if(isNaN(parseInt(lastFiveDaysVapes[i].duration)) === false){
      if(config.vapeFilter) {
        if(parseInt(lastFiveDaysVapes[i].duration >= config.vape_duration_cutoff)){
          lastFiveDaysVapingDuration = lastFiveDaysVapingDuration + (parseInt(lastFiveDaysVapes[i].duration) || 0);
        }
      } else {
        lastFiveDaysVapingDuration = lastFiveDaysVapingDuration + (parseInt(lastFiveDaysVapes[i].duration) || 0);
      }
    }
  }
  // Nicorinee absorbed today (as per report)
  var nicotineToday = (todaysVapingDuration / 1000) * config.constants.nicotinePerSecondVape;
  // Nicotine sbsorbed last five days
  var nicotineAbsorbedLastFiveDays = (lastFiveDaysVapingDuration / 1000) * config.constants.nicotinePerSecondVape;
  // Adjusted nicotine/cigarette conversion rate
  var adjustedCigaretteNicotine = (nicotineAbsorbedLastFiveDays/5) / user.originalCigarettesDaily
  if (adjustedCigaretteNicotine <= config.constants.weakCigaretteNicotine) {
    // Falls back to weak cigarette nicotine conversion rate when the average use is too low
    adjustedCigaretteNicotine = config.constants.weakCigaretteNicotine;
  }// Cigarettes today
  var cigarettesToday = Math.round(nicotineToday / adjustedCigaretteNicotine);
  // Puffs today, based on average puff duration
  var puffsToday = todaysVapingDuration / (todaysVapingDuration / currDaysVapes.length);
  // last five days puffs
  var lastFiveDaysPuffs = lastFiveDaysVapingDuration / (lastFiveDaysVapingDuration / lastFiveDaysVapes.length);
  // Average of daily vaping from last five days
  var averageDailyVapeDurationLastFiveDays = lastFiveDaysVapingDuration / lastFiveDaysVapes.length;
  if (averageDailyVapeDurationLastFiveDays < 50000) {
    averageDailyVapeDurationLastFiveDays = 50000;
  }
  // Avergae nicotine absorbed daily over 5 days
  var averageDailyNicotineLastFiveDays = nicotineAbsorbedLastFiveDays / lastFiveDaysVapes.length;
  // Average Cigarettes a day last five days
  var averageDailyCigarettesLastFiveDays = (lastFiveDaysVapingDuration / 1000) / adjustedCigaretteNicotine;
  // Calculates th baseline nicotine allowance using the minimum content of a cigarette 
  var baselineCigaretteAllowance =  averageDailyNicotineLastFiveDays / config.constants.weakCigaretteNicotine;
  if (baselineCigaretteAllowance >= parseInt(user.originalCigarettesDaily)){
    baselineCigaretteAllowance = parseInt(user.originalCigarettesDaily) - 1;
  }
  // Avergae vape duration from last five days
  var averageIndividualVapeDurationLastFiveDays = lastFiveDaysVapingDuration / lastFiveDaysVapes.length;
  // Calculates the baseline duration allowancce
  var baselineVapingDurationAllowance = baselineCigaretteAllowance * config.constants.nicotinePerSecondVape;
  // Calculates the target vapeing duration allowance
  var targetVapeDurationAllowance = (baselineVapingDurationAllowance + averageDailyVapeDurationLastFiveDays) / 2;
  // Calculates the target nicotine allowance
  var targetNicotineAllowance = (targetVapeDurationAllowance / 1000) * config.constants.nicotinePerSecondVape;
  // Calculates the target cigarette allowance
  var targetCigaretteAllowance = targetNicotineAllowance / adjustedCigaretteNicotine;
  // Calculates the target puffs
  var targetPuffs = targetVapeDurationAllowance / averageIndividualVapeDurationLastFiveDays;
  // vape stat object updated
  vapeStats = {
    "weeksVapingDuration" : weeksVapingDuration,
    "todaysVapingDuration" : todaysVapingDuration,
    "lastFiveDaysVapingDuration" : lastFiveDaysVapingDuration,
    "nicotineToday" :  nicotineToday,
    "nicotineAbsorbedLastFiveDays" : nicotineAbsorbedLastFiveDays,
    "adjustedCigaretteNicotine" : adjustedCigaretteNicotine,
    "cigarettesToday" : cigarettesToday,
    "puffsToday" : puffsToday,
    "averageDailyVapeDurationLastFiveDays": averageDailyVapeDurationLastFiveDays, 
    "lastFiveDaysPuffs" : lastFiveDaysPuffs,
    "baselineCigaretteAllowance" :baselineCigaretteAllowance,
    "baselineVapingDurationAllowance" : baselineVapingDurationAllowance,
    "averageDailyCigarettesLastFiveDays" : averageDailyCigarettesLastFiveDays,
    "averageDailyNicotineLastFiveDays" : averageDailyNicotineLastFiveDays,
    "averageIndividualVapeDurationLastFiveDays" : averageIndividualVapeDurationLastFiveDays,
    "targetVapeDurationAllowance" : targetVapeDurationAllowance,
    "targetNicotineAllowance" : targetNicotineAllowance,
    "targetCigaretteAllowance" : targetCigaretteAllowance,
    "targetPuffs" : targetPuffs
  }
  // Target view updated
  $('#todays').html("<li>Todays</li><li>" + Math.round(vapeStats.cigarettesToday) + " <z>Cigarettes </z></li><li>" + Math.round(vapeStats.nicotineToday, 1) + " <z>ug/mg Nicotine</z> </li><li>" + Math.round(vapeStats.puffsToday) + " <z>Puffs</z> </li>");
  $('#target').html("<li>Target</li><li>" + Math.round(vapeStats.targetCigaretteAllowance) + " <z>Cigarettes</z> </li><li>" + Math.round(vapeStats.targetNicotineAllowance, 1) + " <z>ug/mg Nicotine</z> </li><li>" + Math.round(vapeStats.targetPuffs) + " <z>Puffs</z> </li>");
}
function showTargetGraph() {
  var target_graph_data = [
    {
      value: parseInt(vapeStats.puffsToday),
      // This should change if it goes overs
      color: "#F35F55",
      label: "Todays puffs:"
    },
    {
      value: parseInt(vapeStats.targetPuffs),
      color: "#335650",
      label: "Target puffs:",
    }
  ];
  //console.log(target_graph_data);
  // draws bar graph in div with id vapeGraph
  var ctx = document.getElementById("targetGraph").getContext("2d");
  // fills graph using array generated with data from csv
  window.targetGraph = new Chart(ctx).Doughnut(target_graph_data, {
    responsive : true
  });
};
function showWeeklyVapesGraph() { 
  var currWeeksVapes = getThisWeeks(vapes); 
  // Array of labels for graph
  var labels = [];
  // Array of durations for graph
  var durations = []; 
  // loops through each vape entry
  for (var i = 1, l = currWeeksVapes.length; i < l; i++){
    // checks if hour has been added to already
    if($.inArray(new Date(currWeeksVapes[i].vapedAt).toDateString(), labels) == -1){
      // adds day label and duration at same index when hour label doesn't exist
      labels.push(new Date(currWeeksVapes[i].vapedAt).toDateString());
      // for puffs
      durations.push(parseInt(currWeeksVapes[i].duration / vapeStats.todaysAverageVapeDuration));
    } else {
      // adds duration to duration at index of corresponding label
      var vapesDay = new Date(currWeeksVapes[i].vapedAt).toDateString();
      var duration = labels.indexOf(vapesDay);
      durations[duration] = durations[duration] + parseInt(parseInt(currWeeksVapes[i].duration / vapeStats.todaysAverageVapeDuration)); 
    }
  }
  var barChartData = {
    labels: labels,
    datasets: [
      {
        label: "Todays vapes",
        fillColor: "#F35F55",
        strokeColor: "#F35F55",
        highlightFill: "rgba(220,220,220,0.75)",
        highlightStroke: "rgba(220,220,220,1)",
        data: durations
      } 
    ]
  }
  var ctx = document.getElementById("vapeGraph").getContext("2d");
  // fills graph using array generated with data from csv
  window.myBar = new Chart(ctx).Bar(barChartData, {
    responsive : true
  })
}
// Creates and sends a time object to the arduino
function sendTime(quitStik) { 
  var vapeString = config.vapes_header + String(Math.round(vapeStats.puffsToday)) + '\n';
  var targetString = config.target_header + String(Math.round(vapeStats.puffsToday)) + '\n';
  var timeString = config.time_header + String((new Date().getTime()/1000)) + '\n';
  var sendString = timeString + vapeString + targetString;
  quitStik.write(sendString, function(err, result){
    console.log(err + result);
    if(err){
      $('#setup').html("<p>ERROR Time not syncronised, please reconnect</p>");
      return false;
    } else {
      $('#setup').html("<p>Time syncronised</p>");
      return true;
    }
  }
)};

function sendTarget(quitStik) {
  var targetString = config.target_header + String(Math.round(vapeStats.puffsToday)) + '\n';
  quitStik.write(targetString, function(err, result){
    if(err){console.log("Couldn't sync targets")} else {console.log("Synced Targets")};
  });
}
function sendVapes(quitStik) {
  var vapeString = config.vapes_header + String(Math.round(vapeStats.puffsToday)) + '\n';
  quitStik.write(vapeString, function(err, result){
    if(err){console.log("Couldn't sync vapes")} else { console.log("Syned vapes");}
  });
}
// Saves the vapes array to the file system
function saveVapes() {
  console.log('Saving vapes...');
  fs.writeFile("user_data/vape_log.json", JSON.stringify(vapes, null, 2), function(err) {
  if(err) {
      return console.log(err);
  }
    console.log("The vape log file was saved!");
  });
}
// Fires an autosave evry 5 mins
function autoSave(func, interval) {
  // Check current time and calculate the delay until next interval
  var now = new Date,
  delay = interval - now % interval;
  function start() {
    func();
        setInterval(func, interval);
    }

    // Delay execution until it's an even interval
    setTimeout(start, delay);
}
autoSave(saveVapes, 60 * 5000);

var loading = function(e) {
  e.preventDefault();
  e
.stopPropagation();
  e.target.classList.add('loading');
  e.target.setAttribute('disabled','disabled');
  setTimeout(function(){
    e.target.classList.remove('loading');
    e.target.removeAttribute('disabled');
  },1500);
};

var btns = document.querySelectorAll('button');
for (var i=btns.length-1;i>=0;i--) {
  btns[i].addEventListener('click',loading);
}

//Converts milliseconds to days with a decimal point denoting percentage of next day
function millisecondsToDHM(t){
  var cd = 24 * 60 * 60 * 1000,
      ch = 60 * 60 * 1000,
      d = Math.floor(t / cd),
      h = Math.floor( (t - d * cd) / ch),
      m = Math.round( (t - d * cd - h * ch) / 60000),
      pad = function(n){ return n < 10 ? '0' + n : n; };
  if( m === 60 ){
    h++;
    m = 0;
  }
  if( h === 24 ){
    d++;
    h = 0;
  }
  h = Math.round(h / 24 * 100);
  return [d, pad(h)].join('.');
}

