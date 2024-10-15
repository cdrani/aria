<script lang="ts">
  import { settings } from '$lib/stores';
  import { Button } from './ui/button';
  import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';

  function updateSettings() {
    chrome.storage.sync.set({ settings: $settings });
  }
</script>

<div class="space-y-4">
  <div class="flex items-center space-x-2">
    <label for="muted">Mute System Audio:</label>
    <input type="checkbox" id="muted" bind:checked={$settings.muted} on:change={updateSettings}>
  </div>

  <div class="flex items-center space-x-2">
    <label for="format">Format:</label>
    <Select bind:value={$settings.format} on:change={updateSettings}>
      <SelectTrigger>
        <SelectValue placeholder="Select format" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="webm">WebM</SelectItem>
        <SelectItem value="mp3">MP3</SelectItem>
        <SelectItem value="wav">WAV</SelectItem>
      </SelectContent>
    </Select>
  </div>

  <div class="flex items-center space-x-2">
    <label for="quality">Quality:</label>
    <Select bind:value={$settings.quality} on:change={updateSettings}>
      <SelectTrigger>
        <SelectValue placeholder="Select quality" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={128}>128 kbps</SelectItem>
        <SelectItem value={192}>192 kbps</SelectItem>
        <SelectItem value={256}>256 kbps</SelectItem>
        <SelectItem value={320}>320 kbps</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>