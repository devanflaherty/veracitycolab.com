// CONTACT
// Hide form
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



////////////////////////////////////////
// Validation
////////////////////////////////////////

// Name can't be blank
$('#contactName').on('input', function() {
	var input=$(this);
	var is_name=input.val();
	if(is_name){
    input.removeClass("invalid").addClass("valid");
    input.siblings('label').addClass("float");
  }
	else{
    input.removeClass("valid").addClass("invalid");
    input.siblings('label').removeClass("float");
  }
});

// Message can't be blank
$('#contactMessage').keyup(function(event) {
	var input=$(this);
	var message=$(this).val();
	console.log(message);
	if(message){
    input.removeClass("invalid").addClass("valid");
    input.siblings('label').addClass("float");
  }
	else{
    input.removeClass("valid").addClass("invalid");
    input.siblings('label').removeClass("float");
  }
});

$(document).ready(function() {
    var $fields = $(".inputs :input");
    $fields.keyup(function() {
        var $emptyFields = $fields.filter(function() {
            // remove the $.trim if whitespace is counted as filled
            return $.trim(this.value) === "";
        });

        if (!$emptyFields.length) {
            $("#formSubmit").removeClass("disabled");
        }
    });
});

// Email must be an email
$('#contactEmail').on('input', function() {
	var input=$(this);
  var email=input.val();
  if(email){
    input.siblings('label').addClass("float");
  }
	else{
    input.siblings('label').removeClass("float");
  }
	var re = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
	var is_email=re.test(input.val());
	if(is_email){
    input.removeClass("invalid").addClass("valid");
  }
	else{
    input.removeClass("valid").addClass("invalid");
  }
});
