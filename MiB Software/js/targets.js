
// Load and Parse CSV
$('#generateGraph').click(function(){
  loadVapes();
  $('input[type=file]').parse({
    config: {
      complete: function(results, file) { 
        // Calls the load results function to prepare the data for the graph
        loadResults(results);
      }
    }
  });
});
// Vapes array
var vapes = [];
// Vapes array sorted by time, in ascending order
var vapesByDay = [];  
// Builds array of vape objects
function loadResults(results) {
  // Loops through results to populate vapes array
  for (var i = 1, l = results.data.length; i < l; i++ ){
    // Resets vape object
    vape = {};
    // Adds duration in seconds to vape object
    vape.duration = results.data[ i ][0]/1000;
    // parses datetime into a date object
    var dateTime = results.data[i][2] + " " + results.data[i][1];
    console.log(dateTime);
    vape.datetime = Date.parse(dateTime);
    // checks datetime has been filled before adding to the array
    if(vape.datetime){   
      vapes.push(vape);
    };
  };
  vapesByDay = vapes;
  vapesByDay.sort(function(a, b){return (a.datetime.getTime()) - (b.datetime.getTime())});

  if($("#graphScope option:selected").val() == "hour"){
    graphByDay(vapesByDay);
    //extrapulations(vapesByDay);
    generateTargets(vapesByDay);
  };
};
function graphByDay(vapesByDay){
  // Array of labels for graph
  var labels = [];
  // Array of durations for graph
  var durations = []; 
  // loops through each vape entry
  for (var i = 1, l = vapesByDay.length; i < l; i++){
    // checks if hour has been added to already
    if($.inArray(vapesByDay[i].datetime.toDateString(), labels) == -1){
      // adds day label and duration at same index when hour label doesn't exist
      labels.push(vapesByDay[i].datetime.toDateString());
      durations.push(vapesByDay[i].duration);
    } else {
      // adds duration to duration at index of corresponding label
      var vapesDay = vapesByDay[i].datetime.toDateString();
      var duration = labels.indexOf(vapesDay);
      durations[duration] = durations[duration] + vapesByDay[i].duration; 
    }
  }
  configureGraph(labels, durations);
};
function graphByHour(vapes, day){ 
  // Array of labels for graph
  var labels = [];
  // Array of durations for graph
  var durations = []; 
  // loops through each vape entry
  for (var i = 1, l = vapes.length; i < l; i++){
    // checks if hour has been added to already
    if($.inArray(vapes[i].datetime.getHours(), labels) == -1){
      // adds hour label and duration at same index when hour label doesn't exist
      labels.push(vapes[i].datetime.getHours());
      durations.push(vapes[i].duration);
    } else {
      // adds duration to duration at index of corresponding label
      var vapesDay = vapes[i].datetime.getHours();
      var duration = $.inArray(vapesDay, labels);
      durations[duration] = durations[duration] + vapes[i].duration; 
    }
  }
  configureGraph(labels, durations);
};
// Configures graph for creation, takes array of labels and durations
function configureGraph(labels, durations){   
  var barChartData = {
    labels: labels,
    datasets: [
      {
        label: "Todays vapes",
        fillColor: "rgba(0,0,0,1)",
        strokeColor: "rgba(220,220,220,0.8)",
        highlightFill: "rgba(220,220,220,0.75)",
        highlightStroke: "rgba(220,220,220,1)",
        data: durations
      } 
    ]
  }
  showGraph(barChartData);
}
// Calls the bar graph draw function
function showGraph(barChartData){
  // Hides the uploads button
  $('#upload').hide();
  // draws bar graph in div with id vapeGraph
  var ctx = document.getElementById("vapeGraph").getContext("2d");
  // fills graph using array generated with data from csv
  window.myBar = new Chart(ctx).Bar(barChartData, {
    responsive : true
  });
}
function showGraph2(doughnutChartData){
  // draws bar graph in div with id vapeGraph
  var ctx = document.getElementById("targetGraph").getContext("2d");
  // fills graph using array generated with data from csv
  window.myBar = new Chart(ctx).Doughnut(doughnutChartData, {
    responsive : true
  });
}
function generateTargets(vapesByDay){
  // Sets up constants object
  var constants = {
    // Nicotine absorbed from a weak cigarette in ng/ml
    weakCigaretteNicotine: 2.10,
    // Nicotine absorbed from a strong cigarette in ng/ml
    strongCigaretteNicotine: 18.8,
    // Nicotine absorbed from one seconds of using an ecigarette in ng/ml
    nicotinePerSecondVape: 0.175
  };
  // Calculates initial Cigarette allowance from users entered data
  // Sets the initial cigarettes smoked from text box
  var initialCigarettesPerDay = $('#cigarettesPerDay').val();
  // Calculates the baseline Nicotine
  var baselineNicotine = initialCigarettesPerDay * constants.weakCigaretteNicotine;
  // Calculates the average nicotine intake high with strong cigarettes for initial target 
  var averageNicotine = initialCigarettesPerDay * constants.strongCigaretteNicotine;
  // Calculates the baseline vaping duration allowance 
  var baselineVapingDuration = baselineNicotine * constants.nicotinePerSecondVape;
  // Calculates the average vaping duration allowance
  var averageVapingDuration = averageNicotine * constants.nicotinePerSecondVape;
  // For the total time spent vaping over period
  var totalVapingDuration = 0;
  // Adds todays vapes
  var todaysVapingDuration = 0;
  // Loops through vapes and totals duration
  for (var i = 1, l = vapesByDay.length; i < l; i++){
    totalVapingDuration = totalVapingDuration + vapesByDay[i].duration;
    if(vapesByDay[i].datetime.toDateString() === Date.today().toDateString()){
      todaysVapingDuration = totalVapingDuration + vapesByDay[i].duration;
    }
  }
  // Claculates the amount of days the vaping duration is spread over
  var vapingPeriod = millisecondsToDHM(Math.abs(vapesByDay[vapesByDay.length-1].datetime - vapesByDay[1].datetime));
  // Calculates targets based on vape stick feedback
  var averageDailyVapeDuration = totalVapingDuration / vapingPeriod; 
  // Calculates the nicotine absorbed daily over period
  var nicotineAbsorbedDaily = averageDailyVapeDuration * constants.nicotinePerSecondVape;
  // Caluculates the equivilent nicotine consumed in the cigarettes the user preiviously smoked
  var actualCigarettesDaily = nicotineAbsorbedDaily / initialCigarettesPerDay;
  // Calculates a new baseline Nicotine allowance
  var baselineNicotineAllowance = constants.weakCigaretteNicotine * actualCigarettesDaily;
  // Caluculates the baseline vaping duration allowance
  var baselineDurationAllowance = baselineNicotineAllowance / constants.nicotinePerSecondVape;
  // Calculates the difference between baseline and avergage, the middle number is the target
  var targetVapeDuration = (baselineDurationAllowance + averageDailyVapeDuration) / 1.25;
  // Calculates target nicotine absorbing
  var targetNicotineAllowance = targetVapeDuration * constants.nicotinePerSecondVape;
  // Calculates target cigarette equivilent 
  var targetCigarettesDaily = targetNicotineAllowance / initialCigarettesPerDay;
  // Divides duration by four to give estimate of number of puffs
  var targetPuffsDaily = targetVapeDuration / 4;

  var todaysNicotine = totalVapingDuration*constants.nicotinePerSecondVape;

  var todaysCigarettes = todaysNicotine/initialCigarettesPerDay;
  // Prints the rounded targets to the screen 
  $('.target').prepend("<h2>Targets</h>");
  $('.target > ul').append("<li>" + Math.round(targetCigarettesDaily) + " cigarettes</li>");
  $('.target > ul').append("<li>" + Math.round(targetPuffsDaily) + " puffs</li>");
  $('.target > ul').append("<li>" + Math.round(targetNicotineAllowance) + "ug/mg</li>");

  $('.actual').prepend("<h2>Today's</h1>");
  $('.actual > ul').append("<li>" + Math.round(todaysCigarettes) + " cigarettes</li>");
  $('.actual > ul').append("<li>" + Math.round(todaysVapingDuration / 4) + " puffs</li>");
  $('.actual > ul').append("<li>" + Math.round(todaysNicotine) + " ug/mg</li>");


  var graph2data = [
    {
      value: averageDailyVapeDuration,
      color: "#F7464A",
      hightlight: "#ff5a5e",
      label: "Average" 
    },
    {
      value: targetVapeDuration,
      color: "#FDB45C",
      hightlight: "#FFC870",
      label: "Target"
    },
    {
      value: todaysVapingDuration,
      // This should change if it goes overs
      color: "#5AD3D1",
      hightlight: "#46BFBD",
      label: "todays"
    }
  ];
  showGraph2(graph2data);
  $('.head').fadeOut();
};
function extrapulations(vapesByDay){
  // Total time vapings
  var totalTimeVaping = 0;
  // Total nicotine consumed
  var totalNicotineConsumed = 0;
  // Loops through all vapes
  for (var i = 1, l = vapesByDay.length; i < l; i++){
    // Adds vaping time to the total time spent vaping
    totalTimeVaping = totalTimeVaping + vapesByDay[i].duration;
  };
  // Shows total time spend vaping in minutes with two decimal places (BUG minute in base 10 !!)  
  $('#totalTimeVaping').text((totalTimeVaping / 60).toFixed(2) + " minutes").fadeIn().prev().fadeIn();
  // Shows the total amount of Nicotine absorbed into blood plasma as per reserach & considering 18mg/l strength liquid
  $('#nicotineConsumed').text((totalTimeVaping * 0.175).toFixed(3) + " ng/ml").fadeIn().prev().fadeIn();
  // Shows the nicotine consumed in terms of cigarettes
  $('#cigarettesConsumed').text(((totalTimeVaping * 0.175)/18.8).toFixed(1) + " cigarette").fadeIn().prev().fadeIn();
  // Shows the first vape of the day
  $('#firstVape').text((vapesByDay[0].datetime.getHours()) + ":" + (vapesByDay[0].datetime.getMinutes()) ).fadeIn().prev().fadeIn();
  // Shows the last vape of the day
  $('#lastVape').text((vapesByDay[vapesByDay.length-1].datetime.getHours()) + ":" + (vapesByDay[0].datetime.getMinutes()) ).fadeIn().prev().fadeIn();
  //
  $('#topHoursOfVaping').text();
};
// Private methods
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





function autoSave(func, interval) {
    // Check current time and calculate the delay until next interval
    var now = new Date,
      delay = interval - now % interval;

    function start() {
        // Execute function now...
        func();
        // ... and every interval
        setInterval(func, interval);
    }

    // Delay execution until it's an even interval
    setTimeout(start, delay);
}
autoSave(saveVapes, 60 * 5000);