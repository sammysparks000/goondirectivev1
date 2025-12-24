import { extension_settings, loadExtensionSettings, getContext } from "../../../extensions.js";
import { eventSource, event_types, saveSettingsDebounced } from "../../../../script.js";

const extensionName = "goondirectivev1";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    corruption: 0,
    influence: 50,
    bratFactor: 50,
    currentOutfit: "clothed",
    wardrobe: { 
        clothed: "", 
        underwear: "", 
        nude: "", 
        goon_clip_url: "/media/goon1.mp4" 
    },
    kinks: { gooning: false, stimulants: false, petplay: false, taboo: false }
};

// 1. PROMPT INJECTOR
eventSource.on(event_types.TOKEN_TRANSFORMER_AFTER_PROMPT_CONSTRUCTION, (payload) => {
    const s = extension_settings[extensionName];
    if (!s) return;
    
    const injection = `\n### [GOON-DIRECTIVE: MANDATORY STATE] ###\n` +
        `[STATUS: Corruption ${s.corruption}%, Influence ${s.influence}%, Brat ${s.bratFactor}%]\n` +
        `[MANDATE: Character is ${s.currentOutfit}. Focus on visceral detail and verbal degradation.]\n` +
        `######################################\n`;
    
    payload.prompt += injection;
    console.log("Vault: Mandate injected into prompt construction.");
});

// 2. VIDEO RENDERER
eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (msgId) => {
    const s = extension_settings[extensionName];
    const context = getContext();
    const lastMsg = context.chat[context.chat.length - 1];

    if (lastMsg && lastMsg.mes.includes("[TRIGGER_GOON_CLIP]")) {
        console.log("Vault: Video trigger detected. Rendering player...");
        const videoHtml = `<div class="gd-video-container" style="margin:10px 0; border:2px solid red;">
            <video width="100%" autoplay muted loop playsinline controls src="${s.wardrobe.goon_clip_url}"></video>
        </div>`;
        lastMsg.mes = lastMsg.mes.replace("[TRIGGER_GOON_CLIP]", videoHtml);
    }
});

// 3. UI INITIALIZATION
async function init() {
    console.log("Vault: Initializing GoonDirective...");
    
    // Load settings
    loadExtensionSettings(extensionName, defaultSettings);

    // Load HTML
    try {
        const html = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(html);
        console.log("Vault: UI loaded successfully.");
    } catch (err) {
        console.error("Vault: Failed to load example.html. Check path: " + extensionFolderPath);
    }

    // Listener for UI Sync
    $(document).on("input change", ".gd_sync", function() {
        const key = $(this).data("key");
        const val = $(this).val();
        const keys = key.split('.');
        
        if (keys.length > 1) {
            extension_settings[extensionName][keys[0]][keys[1]] = val;
        } else {
            extension_settings[extensionName][key] = val;
        }
        saveSettingsDebounced();
    });
}

// BOOT
jQuery(init);
