<?php
	$colors = getColors();
	$primaryColor = $colors['primary'];
	$secondaryColor = $colors['secondary'];

	$cta = getCta();
	$value = $cta['ctaValue'];
	$url = $cta['ctaUrl'];
	$blurb = $cta['ctaBlurb'];
	$hidden = $cta['ctaHide'];
	$buttonColor = $cta['ctaColor'];

	if($buttonColor) {
		$primaryColor = $buttonColor;
	}

?>
<?php
	if ( $hidden !== true ) : ?>
	<?php if(is_front_page()) : ?>
    <div id="cta" class="row collapse align-middle"
      data-0="margin-top: 0px;"
      data-end="margin-top: 120px;">
	<?php else : ?>
		<div id="cta" class="row collapse align-middle">
	<?php endif; ?>
    <div class="small-12 medium-8 columns">
      <h2><?= $blurb; ?></h2>
    </div>
    <div class="small-12 medium-4 columns">
     <a class="button expanded" href="<?= $url; ?>" style="background-color: <?= $primaryColor; ?>"><?= $value; ?></a>
    </div>
  </div>
<?php endif; ?>
