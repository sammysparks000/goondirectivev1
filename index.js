import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced, eventSource, event_types } from "../../../../script.js";

const extensionName = "goondirectivev1";

const defaultSettings = {
    influence: 50, corruption: 0, bratFactor: 50,
    currentOutfit: "clothed",
    wardrobe: { clothed: "", underwear: "", nude: "", goon_clip_url: "", pet_clip_url: "" },
    kinks: { gooning: false, stimulants: false, petplay: false, latex: false, impact: false, fluids: false, taboo: false },
    sensoryIntensity: "Extreme",
    keywords: "visceral, heat, slick, throbbing, musk, spit, choke"
};

// 1. THE INJECTOR: This adds the text to the prompt forcefully
eventSource.on(event_types.TOKEN_TRANSFORMER_AFTER_PROMPT_CONSTRUCTION, (payload) => {
    const s = extension_settings[extensionName];
    const activeKinks = Object.keys(s.kinks).filter(k => s.kinks[k]).join(", ");
    
    // This text MUST appear in your "View Sent Prompt"
    const injection = `\n### [GOON-DIRECTIVE: MANDATORY STATE] ###\n` +
        `[STATUS: Corruption ${s.corruption}%, Influence ${s.influence}%, Brat ${s.bratFactor}%]\n` +
        `[ACTIVE KINKS: ${activeKinks}]\n` +
        `[MANDATE: Describe ${s.keywords} with ${s.sensoryIntensity} detail. Use verbal degradation.]\n` +
        `######################################\n`;
    
    // We add it to the very end of the prompt so it's the last thing the AI reads
    payload.prompt += injection;
    console.log(`[${extensionName}] Mandate Injected into Prompt.`);
});

// 2. THE VIDEO & TRIGGER HANDLER
eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, async (msgId) => {
    const context = getContext();
    const lastMsg = context.chat[context.chat.length - 1];
    const s = extension_settings[extensionName];

    // Check for [TRIGGER_GOON_CLIP]
    if (lastMsg.mes.includes("[TRIGGER_GOON_CLIP]")) {
        const videoHtml = `<div class="gd-video-container"><video width="100%" autoplay muted loop playsinline><source src="${s.wardrobe.goon_clip_url}" type="video/mp4"></video></div>`;
        lastMsg.mes = lastMsg.mes.replace("[TRIGGER_GOON_CLIP]", videoHtml);
    }
    
    // Auto-undress logic
    if (/strip|naked|remove/i.test(lastMsg.mes)) {
        s.currentOutfit = (s.currentOutfit === "clothed") ? "underwear" : "nude";
        updateUI();
        saveSettingsDebounced();
    }
});

// 3. UI SYNC & LOAD
function updateUI() {
    const s = extension_settings[extensionName];
    $("#gd_img_display").attr("src", s.wardrobe[s.currentOutfit] || "");
}

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
        updateUI();
        saveSettingsDebounced();
    });

    $(document).on("change", ".gd_kink_toggle", function() {
        extension_settings[extensionName].kinks[$(this).data("kink")] = $(this).is(":checked");
        saveSettingsDebounced();
    });
});
