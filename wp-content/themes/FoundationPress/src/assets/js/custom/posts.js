import $ from 'jquery';

$('.hover-indicator').each(function() {
    var width = $(this).next().children("h3").width();
    $(this).width(width + 40);
});
$( window ).resize(function() {
  $('.hover-indicator').each(function() {
      var width = $(this).next().children("h3").width();
      $(this).width(width + 40);
  });
});
$(".permalink").hover(function(){
    $(this).find('.hover-indicator').toggleClass("hover");
});
