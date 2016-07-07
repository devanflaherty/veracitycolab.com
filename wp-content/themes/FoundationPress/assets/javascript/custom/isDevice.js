function isiPhone(){
  return (
    (navigator.platform.indexOf("iPhone") != -1) ||
    (navigator.platform.indexOf("iPod") != -1)
  );
}
function isiPad(){
  return (
    (navigator.platform.indexOf("iPad") != -1)
  );
}
if(isiPhone()){
  $('body').addClass('iphone');
}

if(isiPad()){
  $('.headline').addClass('relative');
  $('.headline').parent().css("padding-top","0!important");
}
