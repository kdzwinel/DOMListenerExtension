(function () {
    "use strict";

    var nodeRegistry = [];

    var bgPageConnection = chrome.runtime.connect({
        name: "content-script"
    });

    bgPageConnection.postMessage({
        type: 'connected'
    });

    bgPageConnection.onMessage.addListener(function (message, sender, sendResponse) {
        console.log('incoming message', message, sender);

        if (message.type === 'highlight') {
            var node = nodeRegistry[message.nodeId];

            if (node && node.nodeName === '#text') {
                highlightNode(node.parentNode);
            } else {
                highlightNode(node);
            }
        } else if(message.type === 'stop-listening') {
            window.domListenerExtension.stopListening();
        } else if(message.type === 'start-listening') {
            window.domListenerExtension.startListening();
        }
    });

    function highlightNode(node) {
        if (node && node.nodeName === '#text') {
            highlightNode(node.parentNode);
        } else if (node && node.style) {
            var orgVal = node.style.boxShadow;

            var player = node.animate([
                {boxShadow: '0 0 0 3px #33C3F0'},
                {boxShadow: '0 0 0 0 #33C3F0'}
            ], 600);

            player.onfinish = function () {
                node.style.boxShadow = orgVal;
            };
        }
    }

    function nodeToSelector(node) {
        if (node.id) {
            return '#' + node.id;
        } else if (node.classList && node.classList.length) {
            return node.tagName + '.' + Array.prototype.join.call(node.classList, '.');
        } else if (node.parentElement) {
            var parentSelector = nodeToSelector(node.parentElement);

            if (node.nodeName === '#comment') {
                return parentSelector + ' > (comment)';
            } else if (node.nodeName === '#text') {
                return parentSelector;
            } else {
                return parentSelector + ' > ' + node.nodeName
            }
        } else if (node.nodeName) {
            return node.nodeName;
        } else {
            return '(unknown)';
        }
    }

    function nodesToObjects(nodes) {
        return Array.prototype.map.call(nodes, nodeToObject);
    }

    function nodeToObject(node) {
        nodeRegistry.push(node);
        highlightNode(node);

        return {
            selector: nodeToSelector(node),
            nodeId: nodeRegistry.length - 1
        };
    }

    function logEvent(event) {
        //#FBB117 color is named "Beer" and #6F4E37 is named "Coffee". Quite amazingly, they work together nicely.
        console.debug('%cDOM change: %c' + event.type, 'color: #FBB117; font-weight: bold', 'color: #6F4E37', event);

        bgPageConnection.postMessage({
            type: 'event',
            event: event
        });
    }

    function cleanUpNodeRegistry() {
        //get rid of detached nodes
        for (var i = 0, l = nodeRegistry.length; i < l; i++) {
            var node = nodeRegistry[i];

            if (node && !document.contains(node)) {
                nodeRegistry[i] = null;
            }
        }
    }

    function onMutation(records) {
        var record, i, l;

        for (i = 0, l = records.length; i < l; i++) {
            record = records[i];

            if (record.type === 'childList') {
                if (record.addedNodes.length) {
                    logEvent({
                        type: 'nodes added',
                        target: nodeToObject(record.target),
                        nodes: nodesToObjects(record.addedNodes)
                    });
                } else if (record.removedNodes.length) {
                    logEvent({
                        type: 'nodes removed',
                        target: nodeToObject(record.target),
                        nodes: nodesToObjects(record.removedNodes)
                    });

                    cleanUpNodeRegistry();
                }
            } else if (record.type === 'attributes') {
                logEvent({
                    type: 'attribute changed',
                    target: nodeToObject(record.target),
                    attribute: record.attributeName,
                    oldValue: record.oldValue,
                    newValue: record.target.getAttribute(record.attributeName)
                });
            } else if (record.type === 'characterData') {
                logEvent({
                    type: 'text changed',
                    target: nodeToObject(record.target),
                    newValue: record.target.data,
                    oldValue: record.oldValue
                });
            } else {
                console.error('unknown type of event', record);
            }
        }
    }

    if (!window.domListenerExtension) {
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

        if (typeof MutationObserver !== 'function') {
            console.error('DOM Listener Extension: MutationObserver is not available in your browser.');
            return;
        }

        var observer = new MutationObserver(onMutation);

        window.domListenerExtension = {
            _listening: false,
            isListening: function () {
                return this._listening;
            },
            startListening: function () {
                observer.disconnect();
                observer.observe(document, {
                    subtree: true,
                    childList: true,
                    attributes: true,
                    attributeOldValue: true,
                    characterData: true,
                    characterDataOldValue: true
                });
                this._listening = true;

                window.console.debug('%cDOM Listener connected.', 'color: #FBB117; font-weight: bold');
            },
            stopListening: function () {
                observer.disconnect();
                this._listening = false;

                window.console.debug('%cDOM Listener disconnected.', 'color: #FBB117; font-weight: bold');
            }
        };
    }

    if (!window.domListenerExtension.isListening()) {
        window.domListenerExtension.startListening();
    }
})();
