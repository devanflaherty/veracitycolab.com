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
	if ($('body').hasClass('contact')) {
		$('#closeForm').removeClass('visible');
    $('#contactForm').removeClass('contact-reveal');
		$('.overlay').removeClass('visible');
		$('body').removeClass('contact');
  }
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
