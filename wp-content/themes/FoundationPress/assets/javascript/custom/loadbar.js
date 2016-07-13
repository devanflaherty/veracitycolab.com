$(function() {
  $('#loadBar span').animate({ width: '100%' }, 1500, 'swing');
});

// Sequential nav color fade in
$('.desktop-menu li').each(function(index, element) {
  $(element).delay(index*300).queue(function(){
    $(this).addClass('colorize');
  });
});

setTimeout(function(){
  $('.main-content').addClass('animate-in').css({"transform":"translate(0px,0px)"});
  $('.present').addClass('animate-in').css({"transform":"translate(0px,0px)"});

  $('#featured-hero').addClass('animate-in');
  $('.parallax-bg').addClass('animate-in').css({"opacity": "1"});
}, 100);

// Logo fade in
setTimeout(function(){
  $('.home-link').addClass('colorize');
}, 300);

setTimeout(function(){
  $('.main-content').removeClass('animate-in');
  $('.parallax-bg').removeClass('animate-in');
  $('.overlay').removeClass('load');
}, 500);

// Present
