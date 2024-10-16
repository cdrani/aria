<script lang="ts">
  import { ModeWatcher } from 'mode-watcher'
  import { onMount } from 'svelte';
  import TabInfo from '$lib/components/TabInfo.svelte';
  import Settings from '$lib/components/Settings.svelte';
  import Recorder from '$lib/components/Recorder.svelte';
  import Progress from '$lib/components/Progress.svelte';
  import { settings, currentTab } from '$lib/stores';

  onMount(async () => {
    const storedSettings = await chrome.storage.sync.get('settings');
    if (storedSettings.settings) {
      settings.set(storedSettings.settings);
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab.set(tab);
  });
</script>

<ModeWatcher />

<main class="container mx-auto p-4 space-y-4">
  <TabInfo />
  <Settings />
  <Progress />
  <Recorder />
</main>

<style>
  :global(body) {
    width: 350px;
    height: 500px;
  }
</style>
