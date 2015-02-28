(function () {
    "use strict";

    var statusElem = document.querySelector('.status');
    var clearBtn = document.querySelector('.clear');
    var recordBtn = document.querySelector('.record');
    var topBtn = document.querySelector('.top');
    var table = document.querySelector('.events');
    var intro = document.querySelector('.intro');

    var scrollHelper = new ScrollHelper(topBtn);
    var eventTable = new EventTable(table);

    var recording = false;

    recordBtn.addEventListener('click', function () {
        recording = !recording;

        recordBtn.innerText = recording ? 'Stop' : 'Record';

        if (recording) {
            ContentScriptProxy.startRecording();
        } else {
            ContentScriptProxy.stopRecording();
        }

        if (intro.style.display !== 'none') {
            var player = intro.animate([
                {opacity: 1},
                {opacity: 0}
            ], 300);

            player.onfinish = function () {
                intro.style.display = 'none';
            };
        }
    });

    clearBtn.addEventListener('click', function () {
        eventTable.clear();
    });

    topBtn.addEventListener('click', function () {
        scrollHelper.scrollToTheTop();
    });

    // clicking on a node
    table.addEventListener('click', function (e) {
        var target = e.target;

        if (target && target.classList.contains('node') && target.dataset.nodeid) {
            if (e.shiftKey) {
                ContentScriptProxy.inspectNode(target.dataset.nodeid);
            } else {
                ContentScriptProxy.highlightNode(target.dataset.nodeid);
            }
        }
    });

    /**
     * BACKGROUND PAGE CONNECTION
     */

    function injectContentScript() {
        // Send the tab ID to the background page
        bgPageConnection.postMessage({
            type: 'inject',
            tabId: chrome.devtools.inspectedWindow.tabId,
            scriptToInject: "js/DOMListener.js"
        });
    }

    var bgPageConnection = chrome.runtime.connect({
        name: "devtools-page"
    });

    bgPageConnection.onMessage.addListener(function handleMessage(message) {
        if (message.type === 'connected') {
            statusElem.classList.add('connected');

            eventTable.clear();

            if (recording) {
                ContentScriptProxy.startRecording();
            }
        } else if (message.type === 'disconnected') {
            statusElem.classList.remove('connected');

            injectContentScript();
        } else if (message.type === 'event') {
            eventTable.addEvent(message.event);
        }
    });

    injectContentScript();
})();
