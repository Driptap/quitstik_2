// Returns an array of vape objects from the past 5 days, starting yesterday
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