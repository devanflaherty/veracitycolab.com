$(function() {
  if (Foundation.MediaQuery.atLeast('medium')) {
    $('.headline').parent().css("padding-top","140px");
  } else {
    $('.headline').parent().css("padding-top","0");
  }
});

$(window).on('changed.zf.mediaquery', function(event, newSize, oldSize){
  if (Foundation.MediaQuery.atLeast('medium')) {
    $('.headline').parent().css("padding-top","140px");
  } else {
    $('.headline').parent().css("padding-top","0");
  }
});
