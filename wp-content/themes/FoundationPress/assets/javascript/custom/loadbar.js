// Sequential nav color fade in
$('.desktop-menu li').each(function(index, element) {
  $(element).delay(index*300).queue(function(){
    $(this).addClass('colorize');
  });
});

// wait for images
var hero = $("#featured-hero");
if(hero.length) {
  $("#featured-hero").waitForImages(function() {
    setTimeout(function(){
      $("#featured-hero").addClass("animate-in");
      $('.overlay').removeClass('load');
    }, 500);
    setTimeout(function(){
      $('.main-content').addClass('animate-in').css({"transform":"translate(0px,0px)"});
      $('.present').addClass('animate-in').css({"transform":"translate(0px,0px)"});
      $('.parallax-bg').addClass('animate-in').css({"opacity": "1"});
    }, 1000);
  });
} else {
  setTimeout(function(){
    $("#featured-hero").addClass("animate-in");
    $('.overlay').removeClass('load');
    $('.main-content').addClass('animate-in').css({"transform":"translate(0px,0px)"});
    $('.present').addClass('animate-in').css({"transform":"translate(0px,0px)"});
    $('.parallax-bg').addClass('animate-in').css({"opacity": "1"});
  }, 300);
}

// Logo fade in
setTimeout(function(){
  $('.home-link').addClass('colorize');
}, 300);

setTimeout(function(){
  $('.main-content').removeClass('animate-in');
  $('.parallax-bg').removeClass('animate-in');
}, 3000);

// Present
