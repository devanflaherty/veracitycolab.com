//Activate Skrollr
// window.onload = function() {
//   var s = skrollr.init();
//   if (s.isMobile()) {
//       s.destroy();
//   }
// };

$(window).on('changed.zf.mediaquery', function(event, newSize, oldSize){
  if(newSize ==  "medium") {
    if (oldSize == "small") {
      $('.parallax-bg').css({"opacity": "1"});
      $('.main-content').removeClass('animate-in');
      skrollr.init(); // skrollr.init() returns the singleton created above
    }
  }
  if(newSize ==  "small") {
    if (oldSize == "medium") {
      skrollr.init().destroy(); // skrollr.init() returns the singleton created above
      $('.parallax-bg').css({"opacity": "1"});
    }
  }

});
