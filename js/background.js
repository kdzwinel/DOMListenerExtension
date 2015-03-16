(function () {
    "use strict";

    chrome.runtime.onConnect.addListener(function (port) {
        if (port.name === 'devtools-page') {
            handleDevToolsConnection(port);
        } else if (port.name === 'content-script') {
            handleContentScriptConnection(port);
        }
    });

    var devToolsPorts = {};
    var contentScriptPorts = {};

    function handleDevToolsConnection(port) {
        var tabId;

        var messageListener = function (message, sender, sendResponse) {
            console.log('devtools panel', message, sender);

            if (message.type === 'inject') {
                tabId = message.tabId;
                devToolsPorts[tabId] = port;

                chrome.tabs.executeScript(message.tabId, {
                    file: message.scriptToInject,
                    runAt: "document_start"
                }, function () {
                    if (chrome.runtime.lastError) {
                        console.log('Error injecting script', chrome.runtime.lastError);
                    }
                });
            } else {
                //pass message from DevTools panel to a content script
                if (contentScriptPorts[tabId]) {
                    contentScriptPorts[tabId].postMessage(message);
                }
            }
        };

        port.onMessage.addListener(messageListener);

        port.onDisconnect.addListener(function () {
            devToolsPorts[tabId] = undefined;
            contentScriptPorts[tabId] = undefined;
            port.onMessage.removeListener(messageListener);
        });
    }

    function handleContentScriptConnection(port) {
        var tabId = port.sender.tab.id;

        contentScriptPorts[tabId] = port;

        var messageListener = function (message, sender, sendResponse) {
            console.log('content script', message, tabId);

            //pass message from content script to the appropriate DevTools panel
            if (devToolsPorts[tabId]) {
                devToolsPorts[tabId].postMessage(message);
            }
        };

        port.onMessage.addListener(messageListener);

        port.onDisconnect.addListener(function () {
            port.onMessage.removeListener(messageListener);

            //let devtools panel know that content script has disconnected
            if (devToolsPorts[tabId]) {
                devToolsPorts[tabId].postMessage({
                    type: 'disconnected'
                });
            }
        });
    }
})();
