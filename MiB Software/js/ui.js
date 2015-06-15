


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
function showGraphs() {  showBackBtn(); $('#dash').hide(); $('#numbers').hide(); $('#graphs').fadeIn();showWeeklyVapesGraph();showTargetGraph(); $('.graphContainer > h1').text(vapeStats.puffsToday)}
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
// Function populates dashboard with latest vape data
function populateDash() {
  showDash();
  $('#dash > h1').text(parseFloat(vapeStats.puffsToday));
}

