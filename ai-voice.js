// ==========================================
// RAJ AI VOICE ENGINE v1.0
// Part 1 - Foundation
// ==========================================

"use strict";

window.RAJ_AI = window.RAJ_AI || {};

window.RAJ_AI.voice = {

    version: "1.0",

    initialized: false,

    listening: false,

    speaking: false,

    recognition: null,

    synthesis: window.speechSynthesis || null,

    lastText: "",

    lastResponse: "",

    statistics: {

        totalVoiceInput: 0,

        totalVoiceOutput: 0,

        totalErrors: 0

    }

};

// ==========================================
// CONFIG
// ==========================================

window.RAJ_AI.voiceConfig = {

    language: "hi-IN",

    continuous: false,

    interimResults: false,

    autoRestart: false,

    debug: false

};

// ==========================================
// LOG
// ==========================================

function voiceLog(...msg){

    if(window.RAJ_AI.voiceConfig.debug){

        console.log("[RAJ VOICE]",...msg);

    }

}

// ==========================================
// INIT
// ==========================================

function initVoiceEngine(){

    if(window.RAJ_AI.voice.initialized){

        return;

    }

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if(SpeechRecognition){

        window.RAJ_AI.voice.recognition =
            new SpeechRecognition();

    }

    window.RAJ_AI.voice.initialized = true;

    voiceLog("Voice Engine Ready");

}

// ==========================================
// RESET
// ==========================================

function resetVoiceEngine(){

    window.RAJ_AI.voice.listening = false;

    window.RAJ_AI.voice.speaking = false;

    window.RAJ_AI.voice.lastText = "";

    window.RAJ_AI.voice.lastResponse = "";

}

// ==========================================
// PUBLIC API
// ==========================================

window.initVoiceEngine = initVoiceEngine;

window.resetVoiceEngine = resetVoiceEngine;
// ==========================================
// PART 2
// VOICE RECOGNITION + LISTENING
// ==========================================

// ---------- Start Listening ----------
function startListening(){

    const recognition = window.RAJ_AI.voice.recognition;

    if(!recognition){

        return false;

    }

    recognition.lang =
        window.RAJ_AI.voiceConfig.language;

    recognition.continuous =
        window.RAJ_AI.voiceConfig.continuous;

    recognition.interimResults =
        window.RAJ_AI.voiceConfig.interimResults;

    recognition.start();

    window.RAJ_AI.voice.listening = true;

    voiceLog("Listening Started");

    return true;

}

// ---------- Stop Listening ----------
function stopListening(){

    const recognition = window.RAJ_AI.voice.recognition;

    if(!recognition){

        return;

    }

    recognition.stop();

    window.RAJ_AI.voice.listening = false;

    voiceLog("Listening Stopped");

}

// ---------- Result ----------
function setupVoiceRecognition(){

    const recognition = window.RAJ_AI.voice.recognition;

    if(!recognition){

        return;

    }

    recognition.onresult = function(event){

        const text =
            event.results[0][0].transcript;

        window.RAJ_AI.voice.lastText = text;

        window.RAJ_AI.voice.statistics
            .totalVoiceInput++;

        if(typeof processVoice==="function"){

            processVoice(text);

        }

    };

    recognition.onerror = function(e){

        window.RAJ_AI.voice.statistics
            .totalErrors++;

        voiceLog("Voice Error",e);

    };

    recognition.onend = function(){

        window.RAJ_AI.voice.listening=false;

        if(window.RAJ_AI.voiceConfig.autoRestart){

            startListening();

        }

    };

}

// ---------- Public ----------
window.startListening =
startListening;

window.stopListening =
stopListening;

window.setupVoiceRecognition =
setupVoiceRecognition;
// ==========================================
// PART 3
// TEXT TO SPEECH + VOICE COMMANDS
// ==========================================

// ---------- Speak ----------
function speakText(text){

    if(!text || !window.speechSynthesis){

        return;

    }

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = window.RAJ_AI.voiceConfig.language;

    speech.rate = 1.0;

    speech.pitch = 1.0;

    speech.volume = 1.0;

    speech.onstart = function(){

        window.RAJ_AI.voice.speaking = true;

    };

    speech.onend = function(){

        window.RAJ_AI.voice.speaking = false;

        window.RAJ_AI.voice.statistics.totalVoiceOutput++;

    };

    speech.onerror = function(){

        window.RAJ_AI.voice.statistics.totalErrors++;

    };

    window.RAJ_AI.voice.lastResponse = text;

    window.speechSynthesis.speak(speech);

}

// ---------- Stop Speaking ----------
function stopSpeaking(){

    if(window.speechSynthesis){

        window.speechSynthesis.cancel();

    }

    window.RAJ_AI.voice.speaking = false;

}

// ---------- Toggle ----------
function toggleVoice(){

    if(window.RAJ_AI.voice.speaking){

        stopSpeaking();

    }else{

        speakText(window.RAJ_AI.voice.lastResponse);

    }

}

// ---------- Voice Command ----------
function executeVoiceCommand(text){

    const cmd = String(text).toLowerCase();

    if(cmd.includes("stop")){

        stopSpeaking();

        stopListening();

        return true;

    }

    if(cmd.includes("start")){

        startListening();

        return true;

    }

    if(cmd.includes("mute")){

        stopSpeaking();

        return true;

    }

    return false;

}

// ---------- Public ----------
window.speakText = speakText;

window.stopSpeaking = stopSpeaking;

window.toggleVoice = toggleVoice;

window.executeVoiceCommand = executeVoiceCommand;
// ==========================================
// PART 4
// AUTO REPLY + AUTO INIT + FINAL API
// ==========================================

// ---------- Process Voice ----------
async function processVoice(text){

    if(!text) return;

    if(executeVoiceCommand(text)){

        return;

    }

    if(typeof askRajAI !== "function"){

        speakText("राज एआई तैयार नहीं है।");

        return;

    }

    try{

        const result = await askRajAI(text);

        if(result && result.reply){

            speakText(result.reply);

        }

    }catch(e){

        console.error(e);

        speakText("माफ़ कीजिए, उत्तर देने में समस्या हुई।");

    }

}

// ---------- Wake Word ----------
function detectWakeWord(text){

    if(!text) return false;

    text = text.toLowerCase();

    return (

        text.includes("राज") ||

        text.includes("मुंशी") ||

        text.includes("raj ai") ||

        text.includes("ai munshi")

    );

}

// ---------- Statistics ----------
function getVoiceStatistics(){

    return {

        initialized:

            window.RAJ_AI.voice.initialized,

        listening:

            window.RAJ_AI.voice.listening,

        speaking:

            window.RAJ_AI.voice.speaking,

        ...window.RAJ_AI.voice.statistics

    };

}

// ---------- Refresh ----------
function refreshVoiceEngine(){

    setupVoiceRecognition();

    voiceLog("Voice Refreshed");

}

// ---------- Auto Init ----------
window.addEventListener("load",()=>{

    initVoiceEngine();

    refreshVoiceEngine();

});

// ---------- Public ----------
window.processVoice = processVoice;

window.detectWakeWord = detectWakeWord;

window.getVoiceStatistics = getVoiceStatistics;

window.refreshVoiceEngine = refreshVoiceEngine;

// ==========================================
// END OF RAJ AI VOICE ENGINE
// ==========================================

