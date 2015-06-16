// Returns an array of vape objects from the past 5 days, starting yesterday
function getLastFiveDays(vapes) {
  // Sets todays date
  var today = new Date();
  var todayDay = today.getDay()
  // Sets the first and last day
  var first = today.getDate() - (todayDay - 1);
  var last = first + 5;
  // Sets the first and last date object
  var firstDay = new Date(today.setDate(first));
  var lastDay = new Date(today.setDate(last));
  // Sets up array for vape objects
  var lastFiveDaysVapes = [];
  for(var i = 0; i < vapes.length; i++){
    if(new Date(vapes[i].vapedAt) <= lastDay){
      if(new Date(vapes[i].vapedAt) >= firstDay){
        // Vape objects that fall between the first and last date are pushed to the vape array
        lastFiveDaysVapes.push(vapes[i]);
      }
    }
  }
  return lastFiveDaysVapes;
}
// Returns an array of vape objects from the past 7 days, starting now
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
// Returns an array of vape objects from today
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
// Returns an array of dates from an array of vapes
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
// Returns the total duration in milliseconds for an array of vapes
function totalDurationOfThese(vapes) {
  var totalDuration = 0;
  for (var i = 1, l = vapes.length; i < l; i++){
    totalDuration = totalDuration + parseInt(vapes[i].duration);
  }
  return totalDuration;
};

// This function calculates all the related vaping stats
function calculateVapeStats(vapes) {
  //if(vapes.length <= 0) {return}
  var currDaysVapes = getThisDays(vapes);
  var currWeeksVapes = getThisWeeks(vapes);
  var lastFiveDaysVapes = getLastFiveDays(vapes);
  var savingsFromVapes = savingsFrom(vapes).toFixed(2);
  // For the total time spent vaping over period
  // Duration in ms of today
  var todaysVapingDuration = totalDurationOfThese(currDaysVapes);
  // Duration in ms of last seven days vaping
  var weeksVapingDuration = totalDurationOfThese(currWeeksVapes);
  // Duration in ms of last five days (starting yesterdday)
  var lastFiveDaysVapingDuration = totalDurationOfThese(lastFiveDaysVapes);

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
  var puffsUntilTarget = targetPuffs - puffsToday;
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
    "savingsFromVapes" : savingsFromVapes,
    "puffsUntilTarget" : puffsUntilTarget
  }
  // Updates the vape statistics screen
  updateStats();
}