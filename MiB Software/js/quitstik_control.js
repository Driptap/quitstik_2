/*  
    This is QuitStik v2. It is the desktop client for the QuitStik prototype v2 bluetooth ecigarette.
    Please refer to the report for further documentation
      Author:  Sinan Guclu  
*/
path = require('path');
// Requires serialport NW plugin compiled for 32bit windows in, stored in node_modules dir 
var serialport = require(path.join(process.cwd(),"/node_modules/serialport"));
var SerialPort = serialport.SerialPort;
var quitStik;

// Loads node file system plugin 
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
  target_header: "Z",
  vapes_header: "V",
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
          updateDash();
        }
        // Connects to quit stik
        connectToQuitstik(user);
      });
    }  
  });
});

// 
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

// connects to quitstik and listens for vape objects
function connectToPort(port_i, ports){ 
  if(!port_i){showQuitStik(); return false}
  // Checks if ports have been found
  if(ports[0] !== undefined ){ 
    $('#connect').html("<p> Connecting to " + ports[port_i].comName + "</p>");
    quitStik = new SerialPort(ports[port_i].comName, {
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
      syncQuitstik();
      //sendVapes(quitStik);
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
        console.log("User data file was saved!");
      });
      $('#connectedStatus > img ').attr("src", "images/connected_icon.PNG");
      $('#dash').show();
      quitStik.on("data", function (data) {
        var receivedAt = new Date();
        // Logs the reveived serial object to console
        console.log(data)
        // Ignores false vapes (shorter that config.vape_duration_cutoff in ms)
        if(parseFloat(data.split(",")[0]) > config.vape_duration_cutoff){  
          // Checks if date is before 2014
          if(new Date(String(data.split(",")[1])) < 1356998400){
            // Replaces vaped at with current date
            var vapedAt = new Date();
            // Sends time to quitstik
            sendTime(quitStik);
          } else 
          if(new Date(String(data.split(",")[1])) > 1356998400){
            // Converts datetime to iso datetime
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
          if (vape.duration > 6000) {
            vape.duration = 5000;
          }
          //adds to vapes array
          vapes.push(vape);
          // Recalculates of vape statistics
          calculateVapeStats(vapes);
          // Displays smoke puff
          SmokeEffect.makeEffect("smokeSpawnPoint", config.vape_duration_cutoff, 30);
          updateDash();
        }
      }
    );
  });
};
 // Creates and sends a time object to the arduino
function sendTime(quitStik) { 
  var vapeString = config.vapes_header + String(Math.round(vapeStats.puffsToday)) + '\n';
  var targetString = config.target_header + String(Math.round(vapeStats.puffsUntilTarget )) + '\n';
  var timeString = config.time_header + String((new Date().getTime()/1000)) + '\n';
  var sendString = timeString + vapeString + targetString;
  quitStik.write(sendString, function(err, result){
    // Logs serial response to sending time object to dev console
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
function syncQuitstik() {
  var vapeString = config.vapes_header + String(Math.round(vapeStats.puffsToday)) + '\n';
  var targetString = config.target_header + String(Math.round(vapeStats.targetPuffs)) + '\n';
  var timeString = config.time_header + String((new Date().getTime()/1000)) + '\n';
  quitStik.write(timeString, function(err, result){
    // Logs serial response to sending time object to dev console
    console.log(err + result);
  });
};
// sends calculated target to quitstik 
function sendTarget(target) {
  var targetString = config.target_header + String(parseInt(vapeStats.targetPuffs)) + '\n';
  quitStik.write(targetString, function(err, result){
    // Logs serial response to sending time object to dev console
    console.log(err + result);
  });
}// Sends todays total vapes to quitstik
function sendVapes() {
  var vapeString = config.vapes_header + String(parseInt(vapeStats.puffsToday)) + '\n';
  quitStik.write(vapeString, function(err, result){
    if(err){console.log("Couldn't sync vapes")} else { console.log("Syned vapes");}
  });
}// Saves the vapes array to the file system as a JSON file, this is the file re-loaded when the program is started
function saveVapes() {
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
