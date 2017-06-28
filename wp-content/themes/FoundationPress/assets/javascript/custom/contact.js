// CONTACT
var contact = $('#contactForm');

function getVisibleHeight(){
  var subtractHeight = $("#navBar").height() + $("#wpadminbar").height();
  var vH = $(window).height() - subtractHeight;
  return vH;
}
function setContactMargin() {
  $('#contactForm').css('marginTop', getVisibleHeight() * -1);
}

function setContactHeight() {
	$('#contactForm').height(getVisibleHeight());
}

$(function() {
  setContactHeight();
  setContactMargin();
  $( window ).resize(function() {
    setContactHeight();
    setContactMargin();
  });
});

// SlideToggle Contact Form
$('a[href=#contact]').click(function(){
  setContactHeight();
  setContactMargin();
  // Set a class so we can see test the state of the form
  $('#contactForm').css('marginTop', 0);
  $('body').toggleClass("contact");
  $('.overlay').toggleClass('visible');

  // If clicked while form is hidden
  if ($('body').hasClass('contact')) {
     // Slidedown form
     $('#contactForm').addClass('contact-reveal');
     $('#closeForm').addClass('visible');
  } else {
    setContactMargin();
    $('#closeForm').removeClass('visible');
    $('#contactForm').removeClass('contact-reveal');
  }

  if (!$('body').hasClass('mobile-nav')) {
     $('body').toggleClass("fixed");
  }
});

// Close Form Button
$('#closeForm').click(function(){
  setContactMargin();
  $('#closeForm').removeClass('visible');
  $('.overlay').removeClass('visible');
  $('#contactForm').removeClass('contact-reveal');
  $('body').removeClass("contact");

  if (!$('body').hasClass('mobile-nav')) {
    $('body').removeClass("fixed");
  }
});

$(window).load(function(){
  $('.hs-input').each(function() {
    var input=$(this);
    var is_valid=input.val();
    $('select').parent().siblings('label').addClass("float");
    if(is_valid){
      input.removeClass("invalid").addClass("valid");
      input.parent().siblings('label').addClass("float");
    } else{
      input.removeClass("valid").addClass("invalid");
      input.parent().siblings('label').removeClass("float");
    }
  });
  $('.hs-input').on('input', function() {
    var input=$(this);
    var is_valid=input.val();
    if(is_valid){
      input.removeClass("invalid").addClass("valid");
      input.parent().siblings('label').addClass("float");
    } else{
      input.removeClass("valid").addClass("invalid");
      input.parent().siblings('label').removeClass("float");
    }
  });
});
