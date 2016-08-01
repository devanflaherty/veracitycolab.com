// CONTACT

// Change loadbar size on contact hover
$('a[href=#contact]').hover(
  function() {
    $( "#loadBar" ).addClass( "hover" );
  }, function() {
    $( "#loadBar" ).removeClass( "hover" );
  }
);

// SlideToggle Contact Form
$('a[href=#contact]').click(function(){
  // Set a class so we can see test the state of the form
  $('body').toggleClass("contact");
  $('.overlay').toggleClass('visible');

  // If clicked while form is hidden
  if ($('body').hasClass('contact')) {
    // Scroll to top of page
     $("html, body").animate({
      scrollTop: 0
     }, 600);
     // Slidedown form
     $('#contactForm').addClass('reveal');
     $('#closeForm').addClass('visible');
  } else {
    $('#closeForm').removeClass('visible');
    $('#contactForm').removeClass('reveal');
  }

  if (!$('body').hasClass('mobile-nav')) {
     $('body').toggleClass("fixed");
  }
});

// Close Form Button
$('#closeForm').click(function(){
  $('#closeForm').removeClass('visible');
  $('.overlay').removeClass('visible');
  $('#contactForm').removeClass('reveal');
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
