$('#mobileMenu').hide();

// SlideToggle Mobile Nav Form
$('#mobileToggle').click(function(){
  $('#mobileMenu').slideToggle( "slow", function() {});
  $('body').toggleClass("fixed mobile-nav");
  $('#mobileMenu li').each(function(index, element) {
      $(element).delay(index*150).queue(function(){
        $(this).addClass('fade-in');
      });
  });
  // TODO : take fadein class off on hide
});

$(window).on('changed.zf.mediaquery', function(event, newSize, oldSize){
  if(newSize ==  "medium") {
    if(oldSize == "small") {
      $('#mobileMenu').slideUp();
      if ($('body').hasClass("mobile-nav")) {
        $(this).removeClass("fixed mobile-nav");
      }
    }
  }
});
