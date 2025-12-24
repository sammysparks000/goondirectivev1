import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced, eventSource, event_types } from "../../../../script.js";

const extensionName = "goondirectivev1";

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

// THE INJECTOR: This is the part that was missing in your prompt
eventSource.on(event_types.TOKEN_TRANSFORMER_AFTER_PROMPT_CONSTRUCTION, (payload) => {
    const s = extension_settings[extensionName];
    if (!s) return;

    const injection = `\n### [GOON-DIRECTIVE: MANDATORY STATE] ###\n` +
        `[STATUS: Corruption ${s.corruption}%, Influence ${s.influence}%, Brat ${s.bratFactor}%]\n` +
        `[KINK MODE: ${s.kinks.gooning ? 'GOONING ACTIVE' : 'STANDARD'}]\n` +
        `######################################\n`;
    
    payload.prompt += injection;
});

// THE RENDERER: For videos
eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (msgId) => {
    const s = extension_settings[extensionName];
    const context = getContext();
    const lastMsg = context.chat[context.chat.length - 1];

    if (lastMsg && lastMsg.mes.includes("[TRIGGER_GOON_CLIP]")) {
        const videoHtml = `<video width="100%" autoplay muted loop playsinline src="${s.wardrobe.goon_clip_url}"></video>`;
        lastMsg.mes = lastMsg.mes.replace("[TRIGGER_GOON_CLIP]", videoHtml);
    }
});

// INITIALIZATION
jQuery(async () => {
    const html = await $.get(`scripts/extensions/third-party/${extensionName}/example.html`);
    $("#extensions_settings2").append(html);
    
    loadExtensionSettings(extensionName, defaultSettings);

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

    console.log("Vault: GoonDirective Loaded Successfully.");
});
