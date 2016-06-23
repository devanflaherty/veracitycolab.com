function isiPhone(){
  return (
    (navigator.platform.indexOf("iPhone") != -1) ||
    (navigator.platform.indexOf("iPod") != -1)
  );
}
if(isiPhone()){
  $('body').addClass('iphone');
}
