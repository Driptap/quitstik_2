// Gets and instantiates windows object
var gui = require('nw.gui');
var win = gui.Window.get();
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
function showGraphs() {  showBackBtn(); $('#dash').hide(); $('#numbers').hide(); $('#graphs').fadeIn();showWeeklyVapesGraph();showTargetGraph(); $('.graphContainer > div > h1').text(parseInt(vapeStats.puffsToday))}
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
// Function updates dashboard with latest vape data
function updateDash() {
  showDash();
  $('#dash > h1').text(parseInt(vapeStats.puffsToday));
}
// Function updates the details of the statistics page
function updateStats() {
  // Target view updated
  $('#todays').html("<li>Todays</li><li>" + Math.round(vapeStats.cigarettesToday)  + " <z>Cigarettes </z></li><li>" + Math.round(vapeStats.nicotineToday, 1) + " <z>ug/mg Nicotine</z> </li><li>" + Math.round(vapeStats.puffsToday) + " <z>Puffs</z> </li>");
  $('#target').html("<li>Target</li><li>" + Math.round(vapeStats.targetCigarettesPerDay) + " <z>Cigarettes</z> </li><li>" + Math.round(vapeStats.targetNicotineAllowance, 1) + " <z>ug/mg Nicotine</z> </li><li>" + Math.round(vapeStats.targetPuffs) + " <z>Puffs</z> </li>");
}
// Button listeners
// Returns to home screen from other screens
$("#backButton").click(function(){
  showDash();
});
// Quit function 
$("#quitButton").click(function() {
  win.close();
});
// Event listener on button to show targets screen
$("#showTargets").click(function(e){
  e.preventDefault();
  showGraphs();
});
// Event listener on button to show statistics screen
$("#showStats").click(function(e){
  e.preventDefault();
  showStats();
});
// Graph constructors
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
// Shows the barchart with the past weeks vapes
function showWeeklyVapesGraph() { 
  var currWeeksVapes = getLastFiveDays(vapes); 
  //currWeeksVapes.sort 
  // Array of labels for graph
  var labels = [];
  // Array of durations for graph
  var durations = []; 

  var d = new Date();
  var weekday = new Array(7);
  weekday[0]=  "Sunday";
  weekday[1] = "Monday";
  weekday[2] = "Tuesday";
  weekday[3] = "Wednesday";
  weekday[4] = "Thursday";
  weekday[5] = "Friday";
  weekday[6] = "Saturday";


  // loops through each vape entry
  for (var i = 1, l = currWeeksVapes.length; i < l; i++){
    // checks if hour has been added to already
    if($.inArray(weekday[new Date(currWeeksVapes[i].vapedAt).getDay()], labels) == -1){
      // adds day label and duration at same index when hour label doesn't exist
      labels.push(weekday[new Date(currWeeksVapes[i].vapedAt).getDay()]);
      // for puffs
      durations.push((parseFloat(currWeeksVapes[i].duration)/1000) / (vapeStats.todaysAverageVapeDuration/1000) || 0);
    } else {
      // adds duration to duration at index of corresponding label
      var vapesDay = weekday[new Date(currWeeksVapes[i].vapedAt).getDay()];
      var duration = labels.indexOf(vapesDay);
      durations[duration] = parseInt(durations[duration] + (parseFloat(currWeeksVapes[i].duration)/1000) / (vapeStats.todaysAverageVapeDuration/1000) || 0); 
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