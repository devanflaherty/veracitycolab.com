//Activate Skrollr
window.onload = function() {
  var s = skrollr.init();
  if (s.isMobile()) {
      s.destroy();
  }
};

$(window).on('changed.zf.mediaquery', function(event, newSize, oldSize){
  if (Foundation.MediaQuery.atLeast('medium')) {
    $('.parallax-bg').css({"opacity": "1"});
    $('.main-content').removeClass('animate-in');
    skrollr.init(); // skrollr.init() returns the singleton created above
  } else {
    skrollr.init().destroy(); // skrollr.init() returns the singleton created above
    $('.parallax-bg').css({"opacity": "1"});
  }
});
