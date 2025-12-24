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

const kinkLogic = {
    gooning: "Focus on edging, long-form arousal, and 'goon-talk'.",
    stimulants: "Simulate high-intensity energy, 'coke-play' themes, and frantic desire.",
    petplay: "Adopt the persona of a 'kitty/pet'; focus on tail plugs and pet-like submission.",
    latex: "Emphasize the shine, tightness, and scent of latex/shiny gear.",
    impact: "Detail slapping, stinging, and physical marking (face/ass).",
    fluids: "Focus on spitting and draining multiple loads.",
    taboo: "Incorporate Elena cameo, mommy/daughter tension, and cheating themes."
};

function createVideoElement(source, autoplay = true) {
    if (!source) return "";
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

function updateUI() {
    const s = extension_settings[extensionName];
    const imgUrl = s.wardrobe[s.currentOutfit];
    $("#gd_img_display").attr("src", imgUrl || "");
    
    if (s.corruption > 75 || s.kinks.stimulants) {
        $("#gd_img_display").addClass("gd_overstimulated");
    } else {
        $("#gd_img_display").removeClass("gd_overstimulated");
    }
}

async function handleTriggers(message) {
    const s = extension_settings[extensionName];
    let changed = false;

    if (/strip|naked|remove/i.test(message)) {
        s.currentOutfit = (s.currentOutfit === "clothed") ? "underwear" : "nude";
        changed = true;
    }
    if (/moan|cum|please|fuck|spit|choke/i.test(message)) {
        s.corruption = Math.min(100, parseInt(s.corruption) + 5);
        changed = true;
    }

    if (changed) {
        updateUI();
        saveSettingsDebounced();
    }
}

// SINGLE event listener for message rendering
eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (msgId) => {
    const context = getContext();
    const lastMsgObj = context.chat[context.chat.length - 1];
    const s = extension_settings[extensionName];

    // Handle Logic Triggers
    handleTriggers(lastMsgObj.mes);

    // Handle Video Rendering
    const videoRegex = /(?:https?:\/\/|(?:\/|.\/)).+\.(?:mp4|webm|ogg)/i;
    const match = lastMsgObj.mes.match(videoRegex);
    if (match) {
        lastMsgObj.mes = lastMsgObj.mes.replace(match[0], createVideoElement(match[0]));
    }
    
    if (s.kinks.gooning && lastMsgObj.mes.includes("[TRIGGER_GOON_CLIP]")) {
        lastMsgObj.mes = lastMsgObj.mes.replace("[TRIGGER_GOON_CLIP]", createVideoElement(s.wardrobe.goon_clip_url));
    }

    // Append the NSFW System Mandate
    lastMsgObj.mes += getSystemInjection();
});

jQuery(async () => {
    const html = await $.get(`${extensionFolderPath}/example.html`);
    $("#extensions_settings2").append(html);
    loadExtensionSettings(extensionName, defaultSettings);
    
    // Corrected Nested Sync Listener
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
        const kink = $(this).data("kink");
        extension_settings[extensionName].kinks[kink] = $(this).is(":checked");
        saveSettingsDebounced();
    });

    updateUI();
});
