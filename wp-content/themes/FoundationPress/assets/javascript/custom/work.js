$("#featureVideo").fadeOut();

// Playback for Archive Page
function archivePlay(perma) {
  $("body").addClass("video-fixed");
  $("#featured-hero").addClass('video-reveal').removeClass('hidden');
  $("#featured-hero").addClass("click-to-close");
  $(".feature-overlay").addClass("animate-in");
  $('#navBar').addClass('push-up');
  $('.main-content').addClass('push-down');
  $('.feature-play').fadeOut();

  $('#seeProject').attr("href", perma);
  if ($("#seeProject").hasClass ){

  }

  setTimeout(function(){
    $("#featureVideo").fadeIn('slow');
  }, 500);

  return false;
}

$(".play").click(function(){
  if($(this).hasClass('reel')) {
    $('#seeProject').parent().hide();
  } else {
    $('#seeProject').parent().show();
  }
  var permalink = $(this).attr("data-permalink");
  archivePlay(permalink);
});


if(isiPad() || isiPhone()){
  $('.post-block a span').addClass('device');
  $('.post-block a .thumbnail-overlay').addClass('device');

  $(".iplay").bind("touchstart click", function(){
    var permalink = $(this).closest('a').attr("data-permalink");
    archivePlay(permalink);
  });
}

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
      } else if($('body').hasClass('single-advance')) {
        $("#featured-hero").removeClass("video-reveal click-to-close");
        $(".feature-overlay").removeClass("animate-in");
        $('#navBar').removeClass('push-up');
        $('.feature-play').removeClass('blow-up');
        $('.main-content').removeClass('push-down');
      } else {
        $("#featured-hero").removeClass('video-reveal').addClass('hidden');
        $(".feature-overlay").removeClass("animate-in");
        $('#navBar').removeClass('push-up');
        $('.main-content').removeClass('push-down');
      }
    }
  }
});

$(".permalink").hover(function(){
  $(this).siblings(".post-block").find(".permalink-overlay").toggleClass("show");
});
