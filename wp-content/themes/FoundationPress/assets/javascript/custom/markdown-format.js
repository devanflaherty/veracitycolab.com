// Some jquery to add some styling to the markdown parsed html on showcase pages

// Find imgs in a paragraph tag and wrap them in a row
$( "#contentBody p" ).has( "img" ).wrap( '<div class="row expanded collapse flex-wrap" />');
$( ".flex-wrap p" ).has( "img" ).contents().unwrap();

// Find videos we want to put into a column
// iframes are placed in p tags, so let's look there
$( "#contentBody p" ).has("iframe").each(function() {
  // For each p with a video we find we need to wrap it with a .video-column
  $(this).wrap("<div class='columns video-column' />");
  // Now we need to unwrap the p
  $(".video-column p").each(function() {
    $(this).has( "iframe" ).contents().unwrap();
  });
  // If the previous element is an h6 we prepend it to look like a caption
  $(".video-column").each(function() {
    $(this).prev('h6').prependTo($(this));
  });
});

// Let's wrap wistia divs
// They aren't in P tags, so it's a bit easier.
$(".wistia_responsive_padding").wrap("<div class='columns video-column' />");

// Now we wrap it with a new selector, this helps us shift things around
$('.video-column').wrap("<div class='video-selector' />");

// For each .video-selector we're going to go next until the next element is not a video-selector
// So we basically grab all the immediate video siblings
$('.video-selector').each(function() {
  $(this).nextUntil(":not(.video-selector)").appendTo($(this)).contents().unwrap();
});
// We wrap all the siblings in one row
$( ".video-selector" ).wrap( '<div class="row expanded collapse flex-wrap" />');
// And then ditch the .video-selector element
$( ".video-selector" ).has( ".video-column" ).contents().unwrap();

var rowWrap = '<div class="row align-center content"><div class="small-12 columns content-col"></div></div>';
var firstChild = $('#contentBody').children().first();

firstChild.not(".flex-wrap").nextUntil('.flex-wrap').andSelf().wrapAll(rowWrap);

$(".flex-wrap").each(function(i) {
  $(this).nextUntil('.flex-wrap').wrapAll(rowWrap);
  // if img is in an anchor tag wrap the anchor tag in column
  $(this).has( "a" ).find("a").wrap( "<div class='columns'></div>" );
  // if img is in flex-wrap wrap in column
  $(this).has( "img" ).find("img").wrap( "<div class='columns'></div>" );

  // Cleaning up some possibilities
  $(this).has( "a" ).find("a .columns").contents().unwrap();
  $(this).has( "br" ).find("br").remove();
});

// IMG Captions
$(".columns img").each(function() {
  var imageCaption = $(this).attr("alt");
  if (imageCaption) {
    $("<h6>" + imageCaption + "</h6>").insertBefore(this);
  }
});

// GIF loading
$(function() {
  // $('img[src$=".gif"]').each(function() {
  //   var src = $(this).attr("src");
  //   $(this).attr("src", src.replace(/\.gif$/i, ".jpg"));
  //   $(this).addClass("gif");
  // });
  $('.gif').hover(function() {
      var src = $(this).attr("src");
      $(this).attr("src", src.replace(/\.jpg$/i, ".gif"));
    },
    function()
    {
      var src = $(this).attr("src");
      $(this).attr("src", src.replace(/\.gif$/i, ".jpg"));
    });
});
