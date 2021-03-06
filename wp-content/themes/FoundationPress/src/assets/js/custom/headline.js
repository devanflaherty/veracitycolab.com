import $ from 'jquery';
import Foundation from 'foundation-sites';
import { isiPad } from './_isDevice';

$(function() {
  if (Foundation.MediaQuery.atLeast('medium')) {
    if(isiPad()){
      $('.headline').addClass('relative');
      $('.headline').parent().css("padding-top","0!important");
    } else {
      $('.headline').parent().css("padding-top","140px");
    }
  } else {
    $('.headline').parent().css("padding-top","0");
  }
});

if(!isiPad()){
  $(window).on('changed.zf.mediaquery', function(event, newSize, oldSize){
    if (Foundation.MediaQuery.atLeast('medium')) {
      $('.headline').parent().css("padding-top","140px");
    } else {
      $('.headline').parent().css("padding-top","0");
    }
  });
}
