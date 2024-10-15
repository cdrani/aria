<script lang="ts">
  import { currentTab } from '$lib/stores';
</script>

<div class="space-y-2">
  <div class="flex items-center space-x-2">
    <span class="w-16">URL:</span>
    <span class="flex-1 truncate">{$currentTab?.url || 'N/A'}</span>
  </div>
  <div class="flex items-center space-x-2">
    <span class="w-16">Title:</span>
    <span class="flex-1 truncate">{$currentTab?.title || 'N/A'}</span>
  </div>
</div>