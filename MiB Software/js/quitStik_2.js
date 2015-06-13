/*  
    This is QuitStik v2. It is the desktop client for the QuitStik prototype v2 bluetooth ecigarette.
    Please refer to the report for further documentation
      Author:  Sinan Guclu  
*/
path = require('path');

var gui = require('nw.gui');

var serialport = require(path.join(process.cwd(),"/node_modules/serialport"));
var SerialPort = serialport.SerialPort;
var fs = require('fs');
var vapes = [];
var user = {};
vapeStats = {
    "todaysVapingDuration" : 0,
    "todaysAverageVapeDuration" : 0,
    "adjustedCigaretteNicotine" : 0,
    "nicotineToday" : 0,
    "cigarettesToday" : 0,
    "puffsToday" : 0,
    "targetPuffs" : 0,
    "targetCigarettesPerDay" : 0,
    "targetNicotineAllowance" : 0,
    "targetVapingDuration" : 0,
    "baselineCigarettesPerDay" : 0,
    "maximumCigarettesPerDay" : 0,
    "baselineNicotinePerDay" : 0,
    "maximumNicotinePerDay" : 0,
    "baselineVapingDuration" : 0,
    "maximumVapingDuration" : 0,
    "savingsFromVapes" : 0
  }
var newVapeStats = {};
// API configuration data (To be put into a json file)
var config = {
  apiversion: "2.1",
  time_header: "T",
  time_request: 7,
  target_header: "A",
  vapes_header: "B",
  vape_filter: false,
  vape_duration_cutoff : 300,
  constants : {
    // Nicotine absorbed from a weak cigarette in ng/ml
    weakCigaretteNicotine: 2.10,
    // Nicotine absorbed from a strong cigarette in ng/ml
    strongCigaretteNicotine: 18.8,
    // Nicotine absorbed from one seconds of using an ecigarette in ng/ml
    nicotinePerSecondVape: 0.175,
    // number between 1 and 2, 2 being the strictest
    target_division : 1.25,
    // The price of twenty cigarettes
    cigarette_pack_price: 8.60
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
        /// Connects to quit stik
        connectToQuitstik(user);
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
        }
        /// Connects to quit stik
        connectToQuitstik(user);
      });
    }  
  });
});
// UI manipulation functions
// hides the splash screen
function hideSplash() { $('#splash').hide();}
// Shows header of the a[[]]
function showHeader() { $('#header').fadeIn();}
// Hides the header
function hideHeader() { $('#header').hide();}
// Shows connect to quitstik screen
function showQuitStik() {  $('#dash').hide(); $('#numbers').hide(); $('#graphs').hide(); $('#quitstik').fadeIn()}
// Shows targets screen
function showGraphs() {  showBackBtn(); $('#dash').hide(); $('#numbers').hide(); $('#graphs').fadeIn();showWeeklyVapesGraph();showTargetGraph();}
// Shows the dash board
function showDash() {  
  showQuitBtn(); 
  $('#graphs').hide(); 
  $('#numbers').hide(); 
  $('#dash').fadeIn();
}
// Shows statistics page
function showStats() { 
  showBackBtn();
  calculateVapeStats(vapes);
  $('#dash').hide(); 
  $('#graphs').hide(); 
  $('#numbers').fadeIn();         
  $('#todays').html("<li>Todays</li><li>" + Math.round(vapeStats.cigarettesToday) + " <z>Cigarettes </z></li><li>" + Math.round(vapeStats.nicotineToday, 1) + " <z>ug/mg Nicotine</z> </li><li>" + Math.round(vapeStats.puffsToday) + " <z>Puffs</z> </li>");
  $('#target').html("<li>Target</li><li>" + Math.round(vapeStats.targetCigarettesPerDay, 1) + " <z>Cigarettes</z> </li><li>" + Math.round(vapeStats.targetNicotineAllowance, 1) + " <z>ug/mg Nicotine</z> </li><li>" + Math.round(vapeStats.targetPuffs) + " <z>Puffs</z> </li>");
  $('.bottom > h1').text("You've saved £" + vapeStats.savingsFromVapes + " since quitting!")
}
//Show quit button & hides back button
function showQuitBtn() {
  $('#backButton').hide();
  $('#quitButton').show();
}
//Show back button & hides quit button
function showBackBtn(){
  $('#quitButton').hide();
  $('#backButton').show();
}
// Returns to home screen from other screens
$("#backButton").click(function(){
  showDash();
});
// Quit function 
$("#quitButton").click(function() {
  var win = gui.Window.get();
  win.close();
});
$("#showTargets").click(function(){
  showGraphs();
});
$("#showStats").click(showStats);

function connectToQuitstik(user) {
  var ports;
  serialport.list(function (err, ports) {
    var i = 0;
    if(ports.length == 0){ 
      $('#comPorts').append("<option value='false'> No Devices Found </option>");
    } else { 
      ports.forEach(function(port, ports) {
        //Lists com ports of host
        $('#comPorts').append("<option value='" + i + "'> " + port.comName + "</option>");
        i++;
      });
    } 
    $('#connect').click(function(){
      if($('#comPorts option:selected').val()) {   
        // Connects to selected port
        connectToPort($('#comPorts option:selected').val(), ports);
        $('#quitstik').hide();
      }
    });
    if(user.comPort){
      // connects to saved port
      connectToPort(parseFloat(user.comPort), ports);
    } else { 
      showQuitStik();
    }
  }
)};


function connectToPort(port_i, ports){ 
  if(!port_i){showQuitStik(); return false}
  // Checks if ports have been found
  if(ports[0] !== undefined ){ 
    $('#connect').html("<p> Connecting to " + ports[port_i].comName + "</p>");
    var quitStik = new SerialPort(ports[port_i].comName, {
      // serial config
      baudRate: 9600,
      parser: serialport.parsers.readline("\r\n")
    })
  }
  if (quitStik === undefined){ connectToQuitstik(user.comPort = false); return false }
    quitStik.on("error", function(){
      $('.container').append("<div class='errorMsg'><h1>QuitStik connection error, no QuitStik found on this com port</h1><br/><button id='reconnect'>Try a different port</button></div>");
      $('#reconnect').on('click', function(){
        $('.errorMsg').remove();
        connectToQuitstik(user);
      });
    });
    quitStik.on("open", function() {
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
        if(parseFloat(data) === 7){
          sendTime(quitStik);
          return false;
        }
        if(parseFloat(data) === 8){
          sendTarget(quitStik);
          return false;
        }
        if(parseFloat(data) === 9){
          sendVapes(quitStik);
          return false;
        }
        // Ignores false vapes (shorter that config.vape_duration_cutoffms)
        console.log(parseFloat(data.split(",")[0]) > config.vape_duration_cutoff);
        if(parseFloat(data.split(",")[0]) > config.vape_duration_cutoff){  
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
          // Fires recalculation of vape statistics
          calculateVapeStats(vapes);
          // Displays smoke puff
          SmokeEffect.makeEffect("smokeSpawnPoint", config.vape_duration_cutoff, 30);
          //
          $('.graphContainer > h1').text(vapeStats.puffsToday);
          $('#dash').html("<h1>" + parseFloat(vapeStats.puffsToday) + "</h1><div id='smokeSpawnPoint'></div><h4>puffs</h4><button href='#' id='showTargets' data-label='Targets'>Targets</button><br/><br/><button id='showStats' href='#' data-label='Statistics'>Statistics</button>");
          
          $('#showTargets').on('click', function(){
            showGraphs();
          });
          $('#showStats').click(function(){
            showStats();
          });
          if (window.targetGraph) {
            showWeeklyVapesGraph();
          } 
        }
      }
    );
  });
};// Returns an array of vape objects from the past 5 days, starting yesterday
function getLastFiveDays(vapes) {
  var today = new Date();
  var todayDay = today.getDay()
  var first = today.getDate() - (todayDay - 1);
  var last = first + 5;
  var firstDay = new Date(today.setDate(first));
  var lastDay = new Date(today.setDate(last));
  var lastFiveDaysVapes = [];
  for(var i = 0; i < vapes.length; i++){
    if(new Date(vapes[i].vapedAt) <= lastDay){
      if(new Date(vapes[i].vapedAt) >= firstDay){
        lastFiveDaysVapes.push(vapes[i]);
      }
    }
  }
  return lastFiveDaysVapes;
}// Returns an array of vape objects from the past 7 days, starting now
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
}// Returns an array of vape objects from today
function getThisDays(vapes) { 
  // Gets todays epoch
  var today = new Date();
  // gets difference between last + first day
  var first = today.getDate();
  var last = first - 1;
  // Gets epoch for first and last day
  var firstDay = new Date(today.setDate(first));
  var lastDay = new Date(today.setDate(last));
  // Array for this weeks vapes
  var currDaysVapes = [];
  // Loads all vapes from this week into currWeeksVapes array
  for(var i = 0; i < vapes.length; i++){
    if(new Date(vapes[i].vapedAt) >= lastDay){
      if(new Date(vapes[i].vapedAt) <= firstDay){   
        currDaysVapes.push(vapes[i]);
      }
    } 
  }
  return currDaysVapes; 
}
function getDaysOfThese(vapes) {
  var days = []
  for (var i = 1, l = vapes.length; i < l; i++){
    // checks if hour has been added to already
    if($.inArray(new Date(vapes[i].vapedAt).toDateString(), days) == -1){
      // adds day label and duration at same index when hour label doesn't exist
      days.push(new Date(vapes[i].vapedAt).toDateString());
    }
  }
  return days;
}

// This function counts all vapes so is only run once per app launch
var savingsFromVapes = 0;
var totalCigarettes;
var totalNicotine;
function savingsFrom(vapes)  {
  savingsFromVapes = 0;
  if(savingsFromVapes !== 0) {
    return savingsFromVapes;
  } else {
    var totalVapeDuration = 0;
    for (var i = 1, l = vapes.length; i < l; i++){
      totalVapeDuration = totalVapeDuration + parseInt(vapes[i].duration);
    }
    totalNicotine = (totalVapeDuration / 1000) * config.constants.nicotinePerSecondVape;
    totalCigarettes = totalNicotine / parseFloat(vapeStats.adjustedCigaretteNicotine.toFixed(2) || 22);
    savingsFromVapes = (totalCigarettes / 20) * config.constants.cigarette_pack_price;
    return savingsFromVapes;
  }
}
// This function calculates all the related vaping stats
function calculateVapeStats(vapes) {
  //if(vapes.length <= 0) {return}
  var currDaysVapes = getThisDays(vapes);
  var currWeeksVapes = getThisWeeks(vapes);
  var lastFiveDaysVapes = getLastFiveDays(vapes);
  var savingsFromVapes = savingsFrom(vapes).toFixed(2);
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
      if(isNaN(parseFloat(currWeeksVapes[i].duration)) === false) {  
        if(config.vapeFilter) {
          if(parseFloat(currWeeksVapes[i].duration >= config.vape_duration_cutoff)){
            todaysVapingDuration = todaysVapingDuration + (parseFloat(currDaysVapes[i].duration) || 0);
          }
        } else {
          todaysVapingDuration = todaysVapingDuration + (parseFloat(currDaysVapes[i].duration) || 0);
        }
      }
    }
  }// Loops through weeks vapes and calculates totals
  for (var i = 1, l = currWeeksVapes.length; i < l; i++){
    if(isNaN(parseFloat(currWeeksVapes[i].duration)) === false) {
      if(config.vapeFilter){ 
        if(parseFloat(currWeeksVapes[i].duration >= config.vape_duration_cutoff)){   
          weeksVapingDuration = weeksVapingDuration + (parseFloat(currWeeksVapes[i].duration) || 0); 
          if(new Date(currWeeksVapes[i].vapedAt).toDateString() === Date.today().toDateString()){
            todaysVapingDuration = todaysVapingDuration + (parseFloat(currWeeksVapes[i].duration) || 0);
          }
        }
      } else {
        weeksVapingDuration = weeksVapingDuration + (parseFloat(currWeeksVapes[i].duration) || 0); 
        if(new Date(currWeeksVapes[i].vapedAt).toDateString() === Date.today().toDateString()){
          todaysVapingDuration = todaysVapingDuration + (parseFloat(currWeeksVapes[i].duration) || 0);
        }
      }
    } 
  }// loops through last five days vapes and calulates totals
  for (var i = 1, l = lastFiveDaysVapes.length; i < l; i ++){
    if(isNaN(parseFloat(lastFiveDaysVapes[i].duration)) === false){
      if(config.vapeFilter) {
        if(parseFloat(lastFiveDaysVapes[i].duration >= config.vape_duration_cutoff)){
          lastFiveDaysVapingDuration = lastFiveDaysVapingDuration + (parseFloat(lastFiveDaysVapes[i].duration) || 0);
        }
      } else {
        lastFiveDaysVapingDuration = lastFiveDaysVapingDuration + (parseFloat(lastFiveDaysVapes[i].duration) || 0);
      }
    }
  }
  var todaysAverageVapeDuration = todaysVapingDuration / currDaysVapes.length;

  var baselineNicotinePerDay = config.constants.weakCigaretteNicotine * parseInt(user.originalCigarettesDaily);
  var maximumNicotinePerDay = config.constants.strongCigaretteNicotine * parseInt(user.originalCigarettesDaily);


  var baselineVapingDuration = baselineNicotinePerDay / parseFloat(config.constants.nicotinePerSecondVape);
  var maximumVapingDuration =  maximumNicotinePerDay / parseFloat(config.constants.nicotinePerSecondVape);
  
  var baselineCigarettesPerDay = (baselineVapingDuration * config.constants.nicotinePerSecondVape) / config.constants.weakCigaretteNicotine;
  var maximumCigarettesPerDay = (baselineVapingDuration * config.constants.nicotinePerSecondVape) / config.constants.strongCigaretteNicotine; 

  var targetVapingDuration = (baselineVapingDuration + maximumVapingDuration) / parseFloat(config.constants.target_division);
  var targetNicotineAllowance = (baselineNicotinePerDay + maximumNicotinePerDay) / parseFloat(config.constants.target_division);
  var targetCigarettesPerDay = (baselineCigarettesPerDay + maximumCigarettesPerDay) / parseFloat(config.constants.target_division);  
  var targetPuffs = targetVapingDuration / (todaysAverageVapeDuration/1000);

  var adjustedCigaretteNicotine = targetNicotineAllowance / user.originalCigarettesDaily;

  // Nicotine absorbed today (as per report)
  var nicotineToday = (todaysVapingDuration / 1000) * config.constants.nicotinePerSecondVape;
  // equivilent of cigarettes smoked today
  var cigarettesToday = nicotineToday / adjustedCigaretteNicotine ;
  // Puffs today, based on average puff duration
  var puffsToday = todaysVapingDuration / (todaysVapingDuration / currDaysVapes.length);

  if (getDaysOfThese(lastFiveDaysVapes).length > 53) {
     // Nicotine sbsorbed last five days
    var nicotineAbsorbedLastFiveDays = (lastFiveDaysVapingDuration / 1000) * config.constants.nicotinePerSecondVape;
    // Adjusted nicotine/cigarette conversion rate
    var adjustedCigaretteNicotine = (nicotineAbsorbedLastFiveDays/5) / user.originalCigarettesDaily;
    var maximumNicotinePerDay = adjustedCigaretteNicotine;
  } 

  vapeStats = {
    "todaysVapingDuration" : todaysVapingDuration,
    "todaysAverageVapeDuration" : todaysAverageVapeDuration,
    "adjustedCigaretteNicotine" : adjustedCigaretteNicotine,
    "nicotineToday" : nicotineToday,
    "cigarettesToday" : cigarettesToday,
    "puffsToday" : puffsToday,
    "targetPuffs" : targetPuffs,
    "targetCigarettesPerDay" : targetCigarettesPerDay,
    "targetNicotineAllowance" : targetNicotineAllowance,
    "targetVapingDuration" : targetVapingDuration,
    "baselineCigarettesPerDay" : baselineCigarettesPerDay,
    "maximumCigarettesPerDay" : maximumCigarettesPerDay,
    "baselineNicotinePerDay" : baselineNicotinePerDay,
    "maximumNicotinePerDay" : maximumNicotinePerDay,
    "baselineVapingDuration" : baselineVapingDuration,
    "maximumVapingDuration" : maximumVapingDuration,
    "savingsFromVapes" : savingsFromVapes
  }
  // Target view updated
  $('#todays').html("<li>Todays</li><li>" + Math.round(vapeStats.cigarettesToday)  + " <z>Cigarettes </z></li><li>" + Math.round(vapeStats.nicotineToday, 1) + " <z>ug/mg Nicotine</z> </li><li>" + Math.round(vapeStats.puffsToday) + " <z>Puffs</z> </li>");
  $('#target').html("<li>Target</li><li>" + Math.round(vapeStats.targetCigarettesPerDay) + " <z>Cigarettes</z> </li><li>" + Math.round(vapeStats.targetNicotineAllowance, 1) + " <z>ug/mg Nicotine</z> </li><li>" + Math.round(vapeStats.targetPuffs) + " <z>Puffs</z> </li>");
}






// Shows the pie chart comparing targets to daily use
function showTargetGraph() {
  var target_graph_data = [
    {
      value: parseFloat(vapeStats.puffsToday),
      color: "#F35F55",
      label: "Todays puffs:"
    },
    {
      value: parseFloat(vapeStats.targetPuffs),
      color: "#335650",
      label: "Target puffs:",
    }
  ];
  // draws bar graph in div with id targetGraph
  var ctx = document.getElementById("targetGraph").getContext("2d");
  // fills graph using array generated with data from csv
  window.targetGraph = new Chart(ctx).Doughnut(target_graph_data, {
    responsive : true
  });
};
function showWeeklyVapesGraph() { 
  var currWeeksVapes = getThisWeeks(vapes); 
  //currWeeksVapes.sort 
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
      durations.push(parseFloat(currWeeksVapes[i].duration) / (vapeStats.averageIndividualVapeDurationLastFiveDays/1000) || 0);
    } else {
      // adds duration to duration at index of corresponding label
      var vapesDay = new Date(currWeeksVapes[i].vapedAt).toDateString();
      var duration = labels.indexOf(vapesDay);
      durations[duration] = durations[duration] + parseFloat(currWeeksVapes[i].duration) / (vapeStats.averageIndividualVapeDurationLastFiveDays/1000) || 0; 
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
}// Creates and sends a time object to the arduino
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
  });
};
// sends calculated target to quitstik 
function sendTarget(quitStik) {
  var targetString = config.target_header + String(Math.round(vapeStats.puffsToday)) + '\n';
  quitStik.write(targetString, function(err, result){
    if(err){console.log("Couldn't sync targets")} else {console.log("Synced Targets")};
  });
}// Sends todays total vapes to quitstik
function sendVapes(quitStik) {
  var vapeString = config.vapes_header + String(Math.round(vapeStats.puffsToday)) + '\n';
  quitStik.write(vapeString, function(err, result){
    if(err){console.log("Couldn't sync vapes")} else { console.log("Syned vapes");}
  });
}// Saves the vapes array to the file system as a JSON file, this is the file re-loaded when the program is started
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
    }// Delay execution until it's an even interval
    setTimeout(start, delay);
}
autoSave(saveVapes, 60 * 5000);
autoSave(calculateVapeStats, 60 * 1000);
// Button css control 
var loading = function(e) {
  e.preventDefault();
  e.stopPropagation();
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
