// Some jquery to add some styling to the markdown parsed html on showcase pages
// Find imgs in a paragraph tag and wrap them in a row
$( "#contentBody p" ).has( "img" ).wrap( '<div class="row expanded collapse flex-wrap" />');
// Remove the wrapping p tag
$( ".flex-wrap p" ).has( "img" ).contents().unwrap();

var rowWrap = '<div class="row align-center content"><div class="small-11 medium-9 columns content-col"></div></div>';
var firstChild = $('#contentBody').children().first();

firstChild.not(".flex-wrap").nextUntil('.flex-wrap').andSelf().wrapAll(rowWrap);

$(".flex-wrap").each(function(i) {
  $(this).nextUntil('.flex-wrap').wrapAll(rowWrap);
  $(this).has( "a" ).find("a").wrap( "<div class='columns'></div>" );
  $(this).has( "img" ).find("img").wrap( "<div class='columns'></div>" );
  $(this).has( "a" ).find("a .columns").contents().unwrap();
});
$(".youtube-video").addClass("flex-video widescreen");
