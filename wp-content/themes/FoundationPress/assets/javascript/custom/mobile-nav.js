$('#mobileMenu').hide();
function getVisibleHeightNav(){
  var subtractHeight = $("#navBar").height() + $("#wpadminbar").height() + $("#mobileBoxButton").height();
  var vH = $(window).height() - subtractHeight;
  return vH;
}

function setMobileNavHeight() {
	$('#mobileMenu').height(getVisibleHeightNav());
}

$(function() {
	if(isiPad() || isiPhone()){

		setMobileNavHeight();
		$( window ).resize(function() {
			setMobileNavHeight();
		});
	}
});


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
		setContactMargin();
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

	if(oldSize ==  "medium") {
    if(newSize == "small") {
      $('.sticky-container').css('height', 'auto');
    }
  }
});
