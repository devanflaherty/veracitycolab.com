//Activate Skrollr
if ($('body').hasClass('home')) {
  var s = skrollr.init();
}

window.onload = function() {
  var s = skrollr.init();
  if (s.isMobile()) {
      s.destroy();
  }
  if(isiPad()){
    s.destroy(); // skrollr.init() returns the singleton created above
  }
  var currentSize = Foundation.MediaQuery.current;
  if (Foundation.MediaQuery.current == "small") {
    s.destroy(); // skrollr.init() returns the singleton created above
  }
};

$(window).on('changed.zf.mediaquery', function(event, newSize, oldSize){
  if(isiPad()){
  } else {
    if (Foundation.MediaQuery.atLeast('medium')) {
      $('.parallax-bg').css({"opacity": "1"});
      $('.main-content').removeClass('animate-in');
      skrollr.init(); // skrollr.init() returns the singleton created above
    } else {
      skrollr.init().destroy(); // skrollr.init() returns the singleton created above
      $('.parallax-bg').css({"opacity": "1"});
    }
  }
});
