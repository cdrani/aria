<script lang="ts">
  import { Button } from './ui/button';
  import { Label } from './ui/label'
  import AudioSelect from '$lib/components/AudioSelect.svelte';
  import { toggleRecording, stopRecording } from '$lib/recorder/controls';
  import { currentTab } from '$lib/stores';

  let isRecording = false;
  let isPaused = false;
  let recordingType: 'tab' | 'microphone' = 'tab';

  async function handleRecordClick(type: 'tab' | 'microphone') {
    if (!$currentTab) return;
    const result = await toggleRecording(type, $currentTab);
    isRecording = result.isRecording;
    isPaused = result.isPaused;
    recordingType = result.type;
  }

  function handleStopClick() {
    stopRecording();
    isRecording = false;
    isPaused = false;
  }
</script>

<div class="flex flex-col space-y-4 border-secondary border-2 p-4 rounded-md">
    <div class="flex justify-between items-center">
        <AudioSelect />
    </div>

    <div class="flex justify-between items-center ">
        <div class="grid max-w-sm place-items-center gap-2">
            <Button class="rounded-full" variant="outline" size="icon">
                <!-- stop -->
                <!-- <svg class="fill-red-600" xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 20 20"> -->
                <!--     <rect width="16" height="16" x="2" y="2" rx="1" class="fill-red-600" /> -->
                <!-- </svg> -->

                <!-- download -->
                <svg xmlns="http://www.w3.org/2000/svg" width="1.25rem" height="1.25rem" viewBox="0 0 24 24">
	                <!-- <path class="fill-red-600" d="M5 20h14v-2H5zM19 9h-4V3H9v6H5l7 7z" /> -->
                    <path class="fill-red-600" d="M5 20h14v-2H5m14-9h-4V3H9v6H5l7 7z" />
                    <path class="fill-red-600" d="M19 9h-4V3H9v6H5l7 8zM4 19h16v2H4z" />
                </svg>
            </Button>
            <Label for="left-button">Stop</Label>
        </div>

        <div class="grid max-w-sm place-items-center gap-2">
            <Button id="middle-button" class="rounded-full border-red-600" variant="outline" size="lg">

                <!-- record -->
                <svg xmlns="http://www.w3.org/2000/svg" width="1.5rem" height="1.5rem" viewBox="0 0 24 24">
                    <path class="fill-red-600" d="M19 12c0 3.86-3.14 7-7 7s-7-3.14-7-7s3.14-7 7-7s7 3.14 7 7" />
                </svg>

                <!-- play -->
                <!-- <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 36 36"> -->
                <!--     <path class="fill-red-600" d="M32.16 16.08L8.94 4.47A2.07 2.07 0 0 0 6 6.32v23.21a2.06 2.06 0 0 0 3 1.85l23.16-11.61a2.07 2.07 0 0 0 0-3.7Z" class="clr-i-solid clr-i-solid-path-1" /> -->
                <!--     <path fill="none" d="M0 0h36v36H0z" /> -->
                <!-- </svg> -->

                    <!-- pause -->
                <!-- <svg xmlns="http://www.w3.org/2000/svg" width="1.125rem" height="1.125rem" viewBox="0 0 36 36"> -->
                <!--     <rect width="11" height="28" x="3.95" y="4" fill="black" class="fill-red-600 clr-i-solid clr-i-solid-path-1" rx="2.07" ry="2.07" /> -->
                <!--     <rect width="11" height="28" x="20.95" y="4" fill="black" class="fill-red-600 clr-i-solid clr-i-solid-path-2" rx="2.07" ry="2.07" /> -->
                <!--     <path fill="none" d="M0 0h36v36H0z" /> -->
                <!-- </svg> -->
            </Button>
            <Label for="middle-button">Record</Label>
        </div>

        <div class="grid max-w-sm place-items-center gap-2">
            <Button id="right-button" class="rounded-full" variant="outline" size="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="1.125rem" height="1.125rem" viewBox="0 0 20 20">
                    <path class="fill-red-600" d="M12 4h3c.6 0 1 .4 1 1v1H3V5c0-.6.5-1 1-1h3c.2-1.1 1.3-2 2.5-2s2.3.9 2.5 2M8 4h3c-.2-.6-.9-1-1.5-1S8.2 3.4 8 4M4 7h11l-.9 10.1c0 .5-.5.9-1 .9H5.9c-.5 0-.9-.4-1-.9z" />
                </svg>
            </Button>
            <Label for="right-button">Delete</Label>
        </div>
    </div>

  {#if isRecording}
    <Button on:click={handleStopClick} variant="destructive">Stop Recording</Button>
  {/if}
</div>
