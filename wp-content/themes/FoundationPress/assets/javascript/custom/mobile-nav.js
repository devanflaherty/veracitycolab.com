$('#mobileMenu').hide();

// SlideToggle Mobile Nav Form
$('#mobileToggle').click(function(){
	$(this).toggleClass('open');
  $('#mobileMenu').slideToggle( "slow", function() {});
  $('body').toggleClass("fixed mobile-nav");
  $('#mobileMenu li').each(function(index, element) {
      $(element).delay(index*150).queue(function(){
        $(this).addClass('fade-in');
      });
  });
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

$(window).on('changed.zf.mediaquery', function(event, newSize, oldSize){
  if(oldSize ==  "medium") {
    if(newSize == "small") {
      $('.sticky-container').css('height', 'auto');
    }
  }
});
