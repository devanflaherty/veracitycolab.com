// if ($("body").hasClass("post-type-archive-team")){
// // init Isotope
//
// // layout Isotope after each image loads
// var $grid = $('.grid');
//   // init Isotope after all images have loaded
// $grid.isotope({
//   itemSelector: '.grid-item',
//   layoutMode: 'fitRows',
//   percentPosition: true
// });
//
//
// $(window).on('changed.zf.mediaquery', function(event, newSize, oldSize){
//   if(newSize ==  "small" || newSize ==  "mediun" || newSize ==  "large" ) {
//     $grid.isotope('layout');
//   }
// });
//
// // filter items on button click
// $('.filter-button-group').on( 'click', 'button', function() {
//   var filterValue = $(this).attr('data-filter');
//   $grid.isotope({ filter: filterValue });
// });
//
// // change is-checked class on buttons
// $('.filter-button-group').each( function( i, buttonGroup ) {
//   var $buttonGroup = $( buttonGroup );
//   $buttonGroup.on( 'click', 'button', function() {
//     $buttonGroup.find('.is-checked').removeClass('is-checked');
//     $( this ).addClass('is-checked');
//   });
// });
// }
