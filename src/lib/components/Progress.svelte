<script lang="ts">
  import { onMount } from 'svelte';
  import WaveSurfer from 'wavesurfer.js';

  let waveformContainer: HTMLDivElement;
  let wavesurfer: WaveSurfer;

  onMount(() => {
    wavesurfer = WaveSurfer.create({
      container: waveformContainer,
      waveColor: 'violet',
      progressColor: 'purple',
      cursorColor: 'navy',
      height: 100,
      responsive: true,
    });

    return () => {
      wavesurfer.destroy();
    };
  });

  export function updateWaveform(audioUrl: string) {
    wavesurfer.load(audioUrl);
  }
</script>

<div bind:this={waveformContainer} class="w-full h-24 bg-secondary rounded-md"></div>