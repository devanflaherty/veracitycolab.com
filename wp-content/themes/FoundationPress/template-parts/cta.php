<?php
	if ( get_field('choose_cta') !== "Hide" ) {

    if ( get_field('choose_cta') == "Default" ) {

      if( is_singular( 'post' ) ) { // IF IS A POST
        $ctaId = get_field('post_cta_default', 'option');
        $ctaId = $ctaId[0];
  			$value = get_field('cta_button_value', $ctaId);
        $url = get_field('cta_button_url', $ctaId);
        $blurb = get_field('cta_button_blurb', $ctaId);
  		} elseif( is_singular( 'work' ) ) { // IF IS A WORK POST
        $ctaId = get_field('work_cta_default', 'option');
        $ctaId = $ctaId[0];
  			$value = get_field('cta_button_value', $ctaId);
        $url = get_field('cta_button_url', $ctaId);
        $blurb = get_field('cta_button_blurb', $ctaId);
  		} else {
        $ctaId = get_field('post_global_default', 'option');
        $ctaId = $ctaId[0];
  			$value = get_field('cta_button_value', $ctaId);
        $url = get_field('cta_button_url', $ctaId);
        $blurb = get_field('cta_button_blurb', $ctaId);
      }
    } elseif( get_field('choose_cta') == "Select" ) {
			$cta = get_field('call_to_action');
			if( $cta ) {
				foreach( $cta as $p ) {
          $value = get_field('cta_button_value', $p->ID);
          $url = get_field('cta_button_url', $p->ID);
          $blurb = get_field('cta_button_blurb', $p->ID);
				}
			}
		} elseif( get_field('choose_cta') == "Custom" ) {
      $value = get_field('button_value');
      $url = get_field('button_url');
      $blurb = get_field('button_blurb');
    }
	}
?>
<?php
	if ( get_field('choose_cta') &&  get_field('choose_cta') !== "Hide" ) : ?>
	<?php if(is_front_page()) : ?>
    <div id="cta" class="row collapse align-middle"
      data-0="margin-top: 0px;"
      data-end="margin-top: 120px;">
	<?php else : ?>
		<div id="cta" class="row collapse align-middle"
			data-bottom-top="transform: translate(0px, 0px);"
			data-end="transform: translate(0px, 60px)">
	<?php endif; ?>
    <div class="small-12 medium-8 columns text-center">
      <h2><?= $blurb; ?></h2>
    </div>
    <div class="small-12 medium-4 columns">
     <a class="button expanded secondary" href="<?= $url; ?>"><?= $value; ?></a>
    </div>
  </div>
<?php endif; ?>
