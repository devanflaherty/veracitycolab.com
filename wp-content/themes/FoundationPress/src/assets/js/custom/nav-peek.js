import $ from 'jquery';

// Mobile Nav
var lastScrollTop = 0;
$(window).scroll(function(event){
   var st = $(this).scrollTop();

   if (st > lastScrollTop){
     if(st > 150) {
      $("#navigationContainer").addClass('peek-hide');
     }
   } else {
     var offset = lastScrollTop - st;
     if (offset > 2) {
       console.log(offset);
       $("#navigationContainer").removeClass('peek-hide');
       $("#navigationContainer").addClass('peek');
     }
   }
   lastScrollTop = st;
});
