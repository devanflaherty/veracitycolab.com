$("#featureVideo").fadeOut();

//Playback for Archive Page
$(".play").click(function(){
  $("body").addClass("video-fixed");

  $("#featured-hero").addClass("video-reveal click-to-close").removeClass("shrink");
  $(".feature-overlay").addClass("animate-in");
  $('#navBar').addClass('push-up');

  setTimeout(function(){
    $("#featureVideo").fadeIn('slow');
  }, 500);

});

//Playback for Single Page
$(".feature-play").click(function(){

  $("body").addClass("video-fixed video-single");
  $("#featured-hero").addClass("video-reveal click-to-close");
  $(".feature-overlay").addClass("animate-in");
  $("#featureVideo").fadeIn('slow');
  $('#navBar').addClass('push-up');
  $('.feature-play').addClass('blow-up');
  $('.main-content').addClass('push-down');

});

$(document).mouseup(function (e) {
  var container = $(".wistia_embed");

  if ($('body').hasClass('video-fixed')) {
    if (!container.is(e.target) && container.has(e.target).length === 0) {
      $("body").removeClass("video-fixed");
      $("#featureVideo").hide();

      if ($('body').hasClass('video-single')) {
        $("#featured-hero").removeClass("video-reveal click-to-close");
        $(".feature-overlay").removeClass("animate-in");
        $('#navBar').removeClass('push-up');
        $('.feature-play').removeClass('blow-up');
        $('.main-content').removeClass('push-down');
      } else {
        $("#featured-hero").removeClass("video-reveal").addClass("hidden");
        $(".feature-overlay").removeClass("animate-in");
        $('#navBar').removeClass('push-up');
      }
    }
  }
});
