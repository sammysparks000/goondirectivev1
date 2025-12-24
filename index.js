import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced, eventSource, event_types } from "../../../../script.js";

const extensionName = "goondirectivev1";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    influence: 50, corruption: 0, bratFactor: 50,
    currentOutfit: "clothed",
    wardrobe: { clothed: "", underwear: "", nude: "" },
    kinks: { gooning: false, stimulants: false, petplay: false, latex: false, impact: false, fluids: false, taboo: false },
    sensoryIntensity: "Extreme",
    keywords: "visceral, heat, slick, throbbing, musk, spit, choke"
};

// Kink descriptions for prompt injection
const kinkLogic = {
    gooning: "Focus on edging, long-form arousal, and 'goon-talk'.",
    stimulants: "Simulate high-intensity energy, 'coke-play' themes, and frantic desire.",
    petplay: "Adopt the persona of a 'kitty/pet'; focus on tail plugs and pet-like submission.",
    latex: "Emphasize the shine, tightness, and scent of latex/shiny gear.",
    impact: "Detail slapping, stinging, and physical marking (face/ass).",
    fluids: "Focus on spitting and draining multiple loads.",
    taboo: "Incorporate Elena cameo, mommy/daughter tension, and cheating themes."
};

function getSystemInjection() {
    const s = extension_settings[extensionName];
    const activeKinks = Object.keys(s.kinks).filter(k => s.kinks[k]).map(k => kinkLogic[k]).join(" ");
    const exposure = s.currentOutfit === "nude" ? "completely naked" : s.currentOutfit;

    return `\n[GOON-DIRECTIVE V1: ABSOLUTE OVERRIDE]
- COMPLIANCE: ${s.influence}% | CORRUPTION: ${s.corruption}% | BRAT-STATUS: ${s.bratFactor}%
- VISUAL STATE: ${exposure}.
- ACTIVE PREFERENCES: ${activeKinks}.
- MANDATE: Use ${s.sensoryIntensity} detail. Prioritize ${s.keywords}. 
- VERBAL: Use heavy verbal degradation and dirty talk. Avoid clinical terms.
[MANDATE END]`;
}

async function handleTriggers(message) {
    const s = extension_settings[extensionName];
    if (/strip|naked|remove/i.test(message)) {
        s.currentOutfit = s.currentOutfit === "clothed" ? "underwear" : "nude";
    }
    if (/moan|cum|please|fuck|spit|choke/i.test(message)) {
        s.corruption = Math.min(100, parseInt(s.corruption) + 5);
    }
    updateUI();
    saveSettingsDebounced();
}

eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (msgId) => {
    const context = getContext();
    const lastMsg = context.chat[context.chat.length - 1].mes;
    handleTriggers(lastMsg);
    context.chat[context.chat.length - 1].mes += getSystemInjection();
});

function updateUI() {
    const s = extension_settings[extensionName];
    $("#gd_img_display").attr("src", s.wardrobe[s.currentOutfit] || "");
    if (s.corruption > 75 || s.kinks.stimulants) $("#gd_img_display").addClass("gd_overstimulated");
    else $("#gd_img_display").removeClass("gd_overstimulated");
}

jQuery(async () => {
    const html = await $.get(`${extensionFolderPath}/example.html`);
    $("#extensions_settings2").append(html);
    loadExtensionSettings(extensionName, defaultSettings);
    
    $(document).on("input", ".gd_sync", function() {
        extension_settings[extensionName][$(this).data("key")] = $(this).val();
        saveSettingsDebounced();
    });

    $(document).on("change", ".gd_kink_toggle", function() {
        extension_settings[extensionName].kinks[$(this).data("kink")] = $(this).is(":checked");
        saveSettingsDebounced();
    });
});

// Function to generate the Video HTML
function createVideoElement(source, autoplay = true) {
    const autoplayAttr = autoplay ? "autoplay muted" : "";
    return `
    <div class="gd-video-container">
        <video width="100%" height="auto" controls ${autoplayAttr} loop>
            <source src="${source}" type="video/mp4">
            <source src="${source}" type="video/webm">
            Your browser does not support the video tag.
        </video>
    </div>`;
}

// Update the Semantic Listener to handle video triggers
eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (msgId) => {
    const context = getContext();
    const lastMsgObj = context.chat[context.chat.length - 1];
    const s = extension_settings[extensionName];

    // Check if the AI or User included a video trigger/URL
    const videoRegex = /(?:https?:\/\/|(?:\/|.\/)).+\.(?:mp4|webm|ogg)/i;
    const match = lastMsgObj.mes.match(videoRegex);

    if (match) {
        const videoUrl = match[0];
        // Remove the raw URL from the text and replace with the player
        lastMsgObj.mes = lastMsgObj.mes.replace(videoUrl, createVideoElement(videoUrl));
    }
    
    // Auto-Trigger for specific kinks (e.g., Gooning/Stimulants)
    if (s.kinks.gooning && lastMsgObj.mes.includes("[TRIGGER_GOON_CLIP]")) {
        const clipUrl = s.wardrobe.goon_clip_url || ""; 
        lastMsgObj.mes = lastMsgObj.mes.replace("[TRIGGER_GOON_CLIP]", createVideoElement(clipUrl));
    }
    $(document).on("input change", ".gd_sync", function() {
    const key = $(this).data("key");
    const val = $(this).val();
    
    // Logic to handle nested object keys like "wardrobe.clothed"
    const keys = key.split('.');
    if (keys.length > 1) {
        extension_settings[extensionName][keys[0]][keys[1]] = val;
    } else {
        extension_settings[extensionName][key] = val;
    }
    
    updateUI(); // Refresh the character image instantly
    saveSettingsDebounced();
}
    $(document).on("input change", ".gd_sync", function() {
    const key = $(this).data("key");
    const val = $(this).val();
    
    // Logic to handle nested object keys like "wardrobe.clothed"
    const keys = key.split('.');
    if (keys.length > 1) {
        extension_settings[extensionName][keys[0]][keys[1]] = val;
    } else {
        extension_settings[extensionName][key] = val;
    }
    
    updateUI(); // Refresh the character image instantly
    saveSettingsDebounced();
}
});

