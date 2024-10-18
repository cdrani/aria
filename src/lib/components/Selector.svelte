<script lang="ts">
    import * as Select from './ui/select'
    import type { Writable } from 'svelte/store'
    import { writable } from 'svelte/store'

    type Selection = { value: unknown; label?: string }
    type SelectValue = string | number | boolean

    export let label: string
    export let selected: Selection
    export let placeholder: string = 'Select a value'
    export let data: Array<{ label: string; value: number | string | boolean }> = []
    export let handleChange: ({
        key,
        value
    }: {
        key: string
        value: SelectValue
    }) => void = () => {}

    let selection: Writable<Selection> = writable(selected)

    $: if (selected !== $selection) {
        selection.set(selected)
    }
</script>

<Select.Root
    selected={$selection}
    onSelectedChange={(select) => handleChange({ key: label, value: select?.value })}
>
    <Select.Trigger class="w-180px">
        <Select.Value {placeholder} />
    </Select.Trigger>
    <Select.Content>
        <Select.Group>
            <Select.Label class="capitalize">{label}</Select.Label>
            {#each data as item}
                <Select.Item value={item.value} label={item.label}>
                    {item.label}
                </Select.Item>
            {/each}
        </Select.Group>
    </Select.Content>
    <Select.Input name={label.toLowerCase()} />
</Select.Root>
