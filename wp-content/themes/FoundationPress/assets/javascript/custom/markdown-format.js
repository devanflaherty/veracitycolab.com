// Some jquery to add some styling to the markdown parsed html on showcase pages
// Find imgs in a paragraph tag and wrap them in a row
$( "#contentBody p" ).has( "img" ).wrap( '<div class="row expanded collapse flex-wrap" />');
//$( "#contentBody p" ).has("iframe.vc2").each(function() {
//  $(this).next("p").has("iframe.vc2").find("iframe.vc2").append($("iframe.vc2").clone());
//});
$( "#contentBody p" ).has( "iframe" ).wrap( '<div class="row expanded collapse flex-wrap" />');

// Remove the wrapping p tag
$( ".flex-wrap p" ).has( "img" ).contents().unwrap();
$( ".flex-wrap p" ).has( "iframe" ).contents().unwrap();


var rowWrap = '<div class="row align-center content"><div class="small-12 columns content-col"></div></div>';
var firstChild = $('#contentBody').children().first();

firstChild.not(".flex-wrap").nextUntil('.flex-wrap').andSelf().wrapAll(rowWrap);

$(".flex-wrap").each(function(i) {
  $(this).nextUntil('.flex-wrap').wrapAll(rowWrap);
  $(this).has( "a" ).find("a").wrap( "<div class='columns'></div>" );
  $(this).has( "img" ).find("img").wrap( "<div class='columns'></div>" );
  $(this).has( "iframe[src*='wistia.net']" ).find("iframe[src*='wistia.net']").wrap( "<div class='columns'></div>" );


  $(this).has( ".flex-video" ).find( ".flex-video" ).wrap( "<div class='columns'></div>" );
  $(this).has( "a" ).find("a .columns").contents().unwrap();
  $(this).has( "br" ).find("br").remove();
});
$(".youtube-video").addClass("flex-video widescreen");
