<script lang="ts">
  import { Canvas, Layer } from 'svelte-canvas';
  let canvas;
  const pos = $state({
    x: 20,
    y: 20
  });
  const mov = $state({
    x: 0,
    y: 0
  });
  let shape = $state('circle');
  let color = $state('tomato');

  $inspect(pos, mov, shape, color);

	const onKeyDown = (e: KeyboardEvent) => {
    const speed = 5;
		switch (e.keyCode) {
			case 37:
        mov.x = -speed;
				// pos.x -= speed;
        break;
			case 38:
        mov.y = -speed;
				// pos.y -= speed;
        break;
			case 39:
        mov.x = speed;
				// pos.x += speed;
        break;
			case 40:
        mov.y = speed;
				// pos.y += speed;
        break;
			default:
				console.log(e.keyCode);
				if (e.key === ' ') {
					shape = shape === 'circle' ? 'square' : 'circle';
				}
		}
	};

  const onKeyUp = (e: KeyboardEvent) => {
    switch(e.keyCode) {
      case 37:
      case 39:
        mov.x = 0;
        break;
      case 38:
      case 40:
        mov.y = 0;
        break;
    }
  };

	const render = ({
		context,
		width,
		height
	}: {
		context: CanvasRenderingContext2D;
		width: number;
		height: number;
	}) => {
    const x = pos.x + mov.x;
    const y = pos.y + mov.y;

		if (shape === 'circle') {
			context.beginPath();
			context.arc(x, y, 10, 0, Math.PI * 2);
			context.fillStyle = 'tomato';
			context.fill();
		} else if (shape === 'square') {
			context.fillStyle = 'tomato';
			context.fillRect(x - 10, y - 10, 20, 20);
		}
	};
</script>

<svelte:head>
	<title>First Kiss</title>
	<meta name="description" content="A game where you get to try for your first kiss" />
</svelte:head>

<section>
	<Canvas
		width={800}
		height={600}
		style="background: #444444;"
		bind:this={canvas}
	>
		<Layer {render} />
	</Canvas>
</section>

<svelte:window on:keydown|preventDefault={onKeyDown} on:keyup|preventDefault={onKeyUp} />

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 1;
		background: black;
	}
</style>
