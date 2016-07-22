console.log("Background task is running");

// global default state of whether user has getUserMedia permission for audio stream is false
localStorage.setItem("isGetUserMediaInitialized", "false");

// global state of whether Google Vocie API's Voice-To-Text is working
var recognizing = false;

// toggle Lucy on/off by clicking Chrome icon
chrome.browserAction.onClicked.addListener(function() {
    // turn on Lucy Voice-To-Text
    if (!recognizing){
        // initialize getUserMedia if not yet approved by user
        if (!JSON.parse(localStorage.getItem("isGetUserMediaInitialized"))) {
            initializeGetUserMedia();
        }
        
        // if getUserMedia initialization successful, turn on voice-to-text
        if (JSON.parse(localStorage.getItem("isGetUserMediaInitialized"))) {
            startVoiceToText();
        }

    } else { //turn off  
        // turn on voice-to-text
        stopVoiceToText();        
    }
});

// initialize Google Web Speech API
if ('webkitSpeechRecognition' in window) {
    // main Google Web Speech API object for listening to audio stream
    var recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en";

    // initialize timer variable;
    var start_timestamp

    // Google Web Speech APIenent handler on end of audio-processing
    recognition.onresult = function(event) {
        if (recognizing) {
            var final = "";
            var interim = "";

            for (var i = 0; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    var query = "";
                    var latestString = event.results[i][0].transcript;
                    console.log(latestString);

                    // var myString = 'Lucy can you google that for me';
                    // var stringArray = myString.split('Lucy');
                    // stringArray[1];

                    // trigger audio cue that Lucy is listening
                    var dingAudio = new Audio('ding.mp3');
                    dingAudio.play();
                    
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
        }
    };

    // Google Web Speech API enent handler for end of listening
    recognition.onend = function() {
        if (recognizing) {
            recognition.start();
        }
    };

    // Google Web Speech API enent handler for error
    recognition.onerror = function(event) {
        if (event.error == 'no-speech') {
            console.log('info_no_speech');
        }
        if (event.error == 'audio-capture') {
            console.log('info_no_microphone');
        }
        if (event.error == 'not-allowed') {
            if (event.timeStamp - start_timestamp < 100) {
                console.log('info_blocked');
            } else {
                console.log('info_denied');
            }
        }
    };
}

// prompt user for getUserMedia permission via the 
// background page and redirect user to original page
function initializeGetUserMedia() {
    // save current link in local storage so that the
    // options page is able to navigate back to this
    // page after user approves getUserMedia permissions
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        var currentURL = tabs[0].url;

        // regex for: chrome-extension://
        var reg1 = /chrome\-extension:\/\//;

        // regex for: .html
        var reg2 = /initialize\.html/;

        // if current URL has reg1 and reg2, it is the option page.
        // if and only if the current page is not the options page,
        // store the current URL for future
        // refernce in order to return to this page
        if (! ( (reg1.test(currentURL)) && (reg2.test(currentURL)) )) {
            localStorage.setItem('currentURL', currentURL);
        }
    });

    // go to options page to get getUserMedia permissions for audio stream
    chrome.tabs.update({
        url: "initialize.html"
    });
}

// enable Google Web Speech API's Voice-To-Text functionality
function startVoiceToText() {
    // if still listening from last Voice-To-Text session, turn it off
    // in order to restart
    if (recognizing) {
        recognition.stop();
        return;
    }

    // enable Lucy to start listening
    recognition.start();

    // reset key variables for Google Web Speech API
    var final_transcript = '';
    var interim_transcript = '';

    // set global variable tracking whether VoceToText is working
    recognizing = true; 

    // trigger the icon indicating Lucy is listening
    chrome.browserAction.setIcon({path: 'mic.png'})

    // start timer for error debugging purposes
    start_timestamp = event.timeStamp;
}

// turn off Voice-To-Text, along with Lucy
function stopVoiceToText() {
    // set global variable tracking whether VoceToText is working
    recognizing = false;

    // trigger the icon indicating Lucy is not listening
    chrome.browserAction.setIcon({path: 'mic-slash.png'})

    // stop the Voice-To-Text functionality
    recognition.stop();
}