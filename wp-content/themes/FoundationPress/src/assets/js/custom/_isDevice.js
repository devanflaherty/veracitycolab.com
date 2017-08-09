import $ from 'jquery';

export const isiPhone = function(){
  return (
    (navigator.platform.indexOf("iPhone") != -1) ||
    (navigator.platform.indexOf("iPod") != -1)
  );
}
export const isiPad = function(){
  return (
    (navigator.platform.indexOf("iPad") != -1)
  );
}
if(isiPhone()){
  $('body').addClass('iphone');
}
if(isiPad()){
  $('body').addClass('ipad');
}
