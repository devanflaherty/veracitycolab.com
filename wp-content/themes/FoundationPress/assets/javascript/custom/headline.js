if (Foundation.MediaQuery.atLeast('medium')) {
  $('.headline').parent().css("padding-top","120px");
} else {
  $('.headline').parent().css("padding-top","200px");
}

$(window).on('changed.zf.mediaquery', function(event, newSize, oldSize){
  if (Foundation.MediaQuery.atLeast('medium')) {
    $('.headline').parent().css("padding-top","120px");
  } else {
    $('.headline').parent().css("padding-top","200px");
  }
});
