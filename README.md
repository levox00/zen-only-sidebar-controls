# Only Sidebar Controls

A Sine mod for Zen Browser that keeps Back, Forward, Reload and Extensions available as a subtle overlay on the webpage while the compact sidebar is hidden.

- All four controls sit together at the top-left of the page, with a background and hover colors taken from the current browser theme.
- The overlay rests at 10% opacity and becomes fully visible on hover or keyboard focus.
- When the sidebar closes, the controls animate from the sidebar toward the page. Choose Slide, Fade, Compact or None, and Fast, Normal or Slow in the mod settings. Reduced-motion settings suppress the movement.
- It fades out and stops accepting clicks when the sidebar opens.
- The controls follow the webpage edge when the separate top toolbar opens.
- Navigation and the extensions button can be switched separately in the mod settings.
- Back, forward and reload use icons from Zen. The puzzle icon comes from Brave Leo.

## Install with Sine

1. Install [Sine](https://github.com/CosmoCreeper/Sine).
2. Open Zen Settings → Sine Mods. For a locally installed JavaScript mod, allow JavaScript from unofficial sources in Sine if required.
3. In the field for adding a mod from GitHub, enter `https://github.com/levox00/zen-only-sidebar-controls`.
4. Enable **Only Sidebar Controls**. Restart Zen if Sine asks you to.
5. Open its settings to toggle navigation and extensions independently and choose an animation and speed. Both button groups default to enabled, without overwriting existing choices.

This mod executes privileged browser UI JavaScript through Sine; install only code you trust. It does not require the old Visible Controls AutoConfig loader. If an older manually installed Visible Controls script is still active, disable or remove the old installation before enabling this mod; two installations can interfere. Tab RAM Hover is a separate mod.

## Compatibility and testing

Designed around Zen 1.24.3b on Windows and its compact layouts. Sine and Zen internal interfaces can change. The script was exercised in an isolated Zen 1.24.3b profile using a simulated Sine unload callback: four buttons were created together, the themed background resolved, sidebar closing started the configured animation, reopening interrupted it, the None preset suppressed it, and cleanup removed the overlay. Real Sine installation, extension popup interaction and all layout combinations have not yet been verified.

## License and icon attribution

Mozilla Public License 2.0; see [LICENSE](LICENSE). The navigation icon SVGs are derived from [Zen Browser](https://github.com/zen-browser/desktop), and the extensions icon is from [Brave Leo](https://github.com/brave/leo/blob/main/icons/browser-extensions.svg), both under MPL-2.0.
