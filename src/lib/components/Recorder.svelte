<script lang="ts">
  import { Button } from './ui/button';
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

<div class="space-y-4">
  <div class="flex justify-between items-center bg-secondary p-4 rounded-md">
    <span>Tab Audio</span>
    <Button on:click={() => handleRecordClick('tab')}>
      {#if !isRecording || recordingType !== 'tab'}
        Record
      {:else if isPaused}
        Resume
      {:else}
        Pause
      {/if}
    </Button>
  </div>

  <div class="flex justify-between items-center bg-secondary p-4 rounded-md">
    <span>Microphone</span>
    <Button on:click={() => handleRecordClick('microphone')}>
      {#if !isRecording || recordingType !== 'microphone'}
        Record
      {:else if isPaused}
        Resume
      {:else}
        Pause
      {/if}
    </Button>
  </div>

  {#if isRecording}
    <Button on:click={handleStopClick} variant="destructive">Stop Recording</Button>
  {/if}
</div>