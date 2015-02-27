(function () {
    "use strict";

    function callCommand(cmd) {
        chrome.devtools.inspectedWindow.eval(
            cmd,
            {useContentScriptContext: true},
            function (isException, result) {
                if (isException || chrome.runtime.lastError) {
                    console.error('Content script command call failed.', cmd, result, chrome.runtime.lastError);
                }
            }
        );
    }

    window.ContentScriptProxy = {
        inspectNode: function (nodeId) {
            callCommand('inspect(domListenerExtension.getNode(' + nodeId + '))');
        },
        highlightNode: function (nodeId) {
            callCommand('domListenerExtension.highlightNode(' + nodeId + ')');
        },
        startRecording: function () {
            callCommand('domListenerExtension.startListening()');
        },
        stopRecording: function () {
            callCommand('domListenerExtension.stopListening()');
        }
    };
})();
