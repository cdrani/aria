<script lang="ts">
    import { Toggle } from './ui/toggle'
    import { settings } from '$lib/stores'
    import { recorderStore } from '$lib/stores/recorder'

    function updateSettings() {
        chrome.storage.sync.set({ settings: $settings })
    }

    function handleToggle(muted: boolean) {
        recorderStore.toggleMute()
        $settings.muted = muted
        updateSettings()
    }
</script>

<Toggle
    size="sm"
    class="h-6 w-6 p-0"
    aria-label="toggle mute"
    pressed={$settings.muted}
    onPressedChange={handleToggle}
>
    {#if $settings.muted}
        <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 36 36">
            <path
                fill="currentColor"
                d="M24.87 6.69a12.42 12.42 0 0 1 3.88 19.61l1.42 1.42a14.43 14.43 0 0 0-4.43-22.84a1 1 0 0 0-.87 1.8Z"
                class="clr-i-solid clr-i-solid-path-1"
            />
            <path
                fill="currentColor"
                d="m27.3 27.67l-3.84-3.84l-.57-.57L4.63 5L3.21 6.41L8.8 12H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h5.83l9.51 8.3a1 1 0 0 0 1.66-.75V23.2l5.59 5.59c-.17.1-.34.2-.51.29a1 1 0 0 0 .9 1.79c.37-.19.72-.4 1.08-.62l2.14 2.14L30.61 31l-3.25-3.25Z"
                class="clr-i-solid clr-i-solid-path-2"
            />
            <path
                fill="currentColor"
                d="M22.69 12.62A6.27 6.27 0 0 1 25.8 18a6.17 6.17 0 0 1-1.42 3.92l1.42 1.42a8.16 8.16 0 0 0 2-5.34a8.28 8.28 0 0 0-4.1-7.11a1 1 0 1 0-1 1.73Z"
                class="clr-i-solid clr-i-solid-path-3"
            />
            <path
                fill="currentColor"
                d="M20 4.62a1 1 0 0 0-1.66-.75l-6.42 5.6L20 17.54Z"
                class="clr-i-solid clr-i-solid-path-4"
            />
            <path fill="none" d="M0 0h36v36H0z" />
        </svg>
    {:else}
        <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 36 36">
            <path
                fill="currentColor"
                d="M23.41 25.25a1 1 0 0 1-.54-1.85a6.21 6.21 0 0 0-.19-10.65a1 1 0 1 1 1-1.73a8.21 8.21 0 0 1 .24 14.06a1 1 0 0 1-.51.17"
                class="clr-i-solid clr-i-solid-path-1"
            />
            <path
                fill="currentColor"
                d="M25.62 31.18a1 1 0 0 1-.45-1.89A12.44 12.44 0 0 0 25 6.89a1 1 0 1 1 .87-1.8a14.44 14.44 0 0 1 .24 26a1 1 0 0 1-.49.09"
                class="clr-i-solid clr-i-solid-path-2"
            />
            <path
                fill="currentColor"
                d="m18.33 4l-9.26 8h-6a1 1 0 0 0-1 1v9.92a1 1 0 0 0 1 1h5.81l9.46 8.24a1 1 0 0 0 1.66-.73V4.72A1 1 0 0 0 18.33 4"
                class="clr-i-solid clr-i-solid-path-3"
            />
            <path fill="none" d="M0 0h36v36H0z" />
        </svg>
    {/if}
</Toggle>
