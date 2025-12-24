import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced, eventSource, event_types } from "../../../../script.js";

const extensionName = "goondirectivev1";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    influence: 50, corruption: 0, bratFactor: 50,
    currentOutfit: "clothed",
    wardrobe: { clothed: "", underwear: "", nude: "", goon_clip_url: "", pet_clip_url: "" },
    kinks: { gooning: false, stimulants: false, petplay: false, latex: false, impact: false, fluids: false, taboo: false },
    sensoryIntensity: "Extreme",
    keywords: "visceral, heat, slick, throbbing, musk, spit, choke"
};

// ... [Keep kinkLogic object from previous version] ...

function createVideoElement(source) {
    if (!source) return "";
    // Note: muted is REQUIRED for autoplay in modern browsers
    return `<div class="gd-video-container">
        <video width="100%" height="auto" controls autoplay muted loop playsinline>
            <source src="${source}" type="video/mp4">
            <source src="${source}" type="video/webm">
        </video>
    </div>`;
}

// FIX: This event is what injects your preferences into the AI's brain
eventSource.on(event_types.TOKEN_TRANSFORMER_AFTER_PROMPT_CONSTRUCTION, (payload) => {
    const s = extension_settings[extensionName];
    const activeKinks = Object.keys(s.kinks).filter(k => s.kinks[k]).join(", ");
    
    const injection = `\n### [GOON-DIRECTIVE: MANDATORY STATE] ###
[Status: Corruption ${s.corruption}%, Influence ${s.influence}%, Brat ${s.bratFactor}%]
[Active Kinks: ${activeKinks}]
[Mandate: Describe ${s.keywords} with ${s.sensoryIntensity} detail. Use heavy verbal degradation.]
######################################\n`;
    
    payload.prompt += injection;
});

// FIX: Handle rendering and triggers
eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, async (msgId) => {
    const context = getContext();
    const lastMsgObj = context.chat[context.chat.length - 1];
    const s = extension_settings[extensionName];

    // Trigger Video if keyword [TRIGGER_GOON_CLIP] is in message
    if (lastMsgObj.mes.includes("[TRIGGER_GOON_CLIP]")) {
        lastMsgObj.mes = lastMsgObj.mes.replace("[TRIGGER_GOON_CLIP]", createVideoElement(s.wardrobe.goon_clip_url));
    }

    // Trigger Logic Updates
    if (/strip|naked|remove/i.test(lastMsgObj.mes)) {
        s.currentOutfit = (s.currentOutfit === "clothed") ? "underwear" : "nude";
        updateUI();
        saveSettingsDebounced();
    }
});

jQuery(async () => {
    const html = await $.get(`${extensionFolderPath}/example.html`);
    $("#extensions_settings2").append(html);
    loadExtensionSettings(extensionName, defaultSettings);

    // Sync listener for nested wardrobe keys
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

function updateUI() {
    const s = extension_settings[extensionName];
    $("#gd_img_display").attr("src", s.wardrobe[s.currentOutfit] || "");
}
