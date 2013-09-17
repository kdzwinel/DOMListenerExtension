var attachedTabs = {};

function startListening(tabId) {
    chrome.tabs.executeScript(tabId, {
        file: 'DOMListener.js'
    }, function() {
        attachedTabs[tabId] = true;

        chrome.browserAction.setIcon({tabId: tabId, path: "ico/ear-on.png"});
        chrome.browserAction.setTitle({tabId: tabId, title: "Stop listening for DOM events"});
    });
}

function stopListening(tabId) {
    attachedTabs[tabId] = undefined;

    chrome.tabs.executeScript(tabId, {
        code: 'window.domListenerExtension ? window.domListenerExtension.disconnect() : null;'
    });

    chrome.browserAction.setIcon({tabId: tabId, path: "ico/ear-off.png"});
    chrome.browserAction.setTitle({tabId: tabId, title: "Listen for DOM events"});
}

function tabUpdated(tabId, changeInfo, tab) {
    if(!attachedTabs[tabId]) {
        return;
    }

    if (changeInfo.status === 'complete') {
        //re-inject the script if tab was reloaded or URL changed
        startListening(tabId);
    }
}

chrome.browserAction.onClicked.addListener(function(tab) {
    if (!attachedTabs[tab.id]) {
        startListening(tab.id);
        chrome.tabs.onUpdated.addListener(tabUpdated);
    } else {
        stopListening(tab.id);
        chrome.tabs.onUpdated.removeListener(tabUpdated);
    }
});