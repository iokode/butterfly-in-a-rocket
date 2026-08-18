<script lang="ts">
    import {icons, type IconName} from "../helpers/icons";

    /**
     * The Svelte twin of Icon.astro, for the comment island. Both read their paths from
     * helpers/icons so the same name can never render different artwork in the two.
     */

    export let name: IconName;
    export let size: number = 18;
    /** Accessible name. Omit only when adjacent text already labels the icon. */
    export let label: string | undefined = undefined;
</script>

<svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="square"
    stroke-linejoin="miter"
    role={label ? "img" : "presentation"}
    aria-label={label}
    aria-hidden={label ? undefined : "true"}
    focusable="false"
>{@html icons[name]}</svg>

<style>
    svg {
        /* Box model */
        display: block;
        flex: none;
    }
</style>
