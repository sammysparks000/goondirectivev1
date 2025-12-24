(async function() {
    console.log("!!! GOON-DIRECTIVE V1: SYSTEM BOOT SEQUENCE INITIATED !!!");

    // Core Imports
    const { extension_settings, getContext, loadExtensionSettings } = await import("../../../extensions.js");
    const { saveSettingsDebounced, eventSource, event_types } = await import("../../../../script.js");

    const extensionName = "goondirectivev1";
    const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

    const defaultSettings = {
        influence: 50,
        corruption: 0,
        bratFactor: 50,
        currentOutfit: "clothed",
        wardrobe: { 
            clothed: "", 
            underwear: "", 
            nude: "", 
            goon_clip_url: "/media/goon1.mp4", 
            pet_clip_url: "" 
        },
        kinks: { gooning: false, stimulants: false, petplay: false, latex: false, impact: false, fluids: false, taboo: false },
        sensoryIntensity: "Extreme",
        keywords: "visceral, heat, slick, throbbing, musk, spit, choke"
    };

    // 1. THE PROMPT INJECTOR (Makes AI act on the kinks)
    eventSource.on(event_types.TOKEN_TRANSFORMER_AFTER_PROMPT_CONSTRUCTION, (payload) => {
        const s = extension_settings[extensionName];
        if (!s) return;

        const activeKinks = Object.keys(s.kinks).filter(k => s.kinks[k]).join(", ");
        
        const injection = `\n### [GOON-DIRECTIVE: MANDATORY STATE] ###\n` +
            `[STATUS: Corruption ${s.corruption}%, Influence ${s.influence}%, Brat ${s.bratFactor}%]\n` +
            `[VISUAL: Character is currently ${s.currentOutfit}]\n` +
            `[ACTIVE KINKS: ${activeKinks}]\n` +
            `[MANDATE: Describe ${s.keywords} with ${s.sensoryIntensity} detail. Use heavy verbal degradation.]\n` +
            `######################################\n`;
        
        payload.prompt += injection;
        console.log("GOON-DIRECTIVE: Prompt Injection Verified.");
    });

    // 2. THE VIDEO PLAYER ENGINE
    function createVideoHTML(source) {
        if (!source) return "[Error: No Video Source Found]";
        return `<div class="gd-video-container" style="border: 2px solid #ff0000; background: #000; margin: 10px 0;">
            <video width="100%" height="auto" autoplay muted loop playsinline controls>
                <source src="${source}" type="video/mp4">
                <source src="${source}" type="video/webm">
            </video>
        </div>`;
    }

    // 3. SEMANTIC TRIGGER & RENDERER
    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (msgId) => {
        const context = getContext();
        const lastMsg = context.chat[context.chat.length - 1];
        const s = extension_settings[extensionName];

        // Trigger Video if [TRIGGER_GOON_CLIP] is found
        if (lastMsg.mes.includes("[TRIGGER_GOON_CLIP]")) {
            console.log("GOON-DIRECTIVE: Executing Video Playback.");
            lastMsg.mes = lastMsg.mes.replace("[TRIGGER_GOON_CLIP]", createVideoHTML(s.wardrobe.goon_clip_url));
        }

        // Logic for Auto-Undress
        if (/strip|naked|remove clothes/i.test(lastMsg.mes)) {
            s.currentOutfit = (s.currentOutfit === "clothed") ? "underwear" : "nude";
            updateUI();
            saveSettingsDebounced();
        }
    });

    // 4. UI UPDATE FUNCTION
    function updateUI() {
        const s = extension_settings[extensionName];
        $("#gd_img_display").attr("src", s.wardrobe[s.currentOutfit] || "");
        if (s.corruption > 75 || s.kinks.stimulants) {
            $("#gd_img_display").addClass("gd_overstimulated");
        } else {
            $("#gd_img_display").removeClass("gd_overstimulated");
        }
    }

    // 5. INITIALIZATION
    jQuery(async () => {
        const html = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(html);
        
        loadExtensionSettings(extensionName, defaultSettings);

        // Sync Sliders and Inputs
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

        // Sync Kink Checkboxes
        $(document).on("change", ".gd_kink_toggle", function() {
            const kink = $(this).data("kink");
            extension_settings[extensionName].kinks[kink] = $(this).is(":checked");
            saveSettingsDebounced();
        });

        updateUI();
        console.log("!!! GOON-DIRECTIVE V1: READY !!!");
    });
})();
