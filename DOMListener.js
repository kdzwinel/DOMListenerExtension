(function () {
    "use strict";

    function repeat(s, n) {
        var a = [];
        while (a.length < n) {
            a.push(s);
        }
        return a.join('');
    }

    function logEvent(name, details) {
        //making output more readable by removing __proto__
        details.__proto__ = null;

        //unifying length of 'name' fields
        name += repeat(" ", (16 - name.length));

        //packing details into an object with only one attribute in order to make the console output smaller
        details = {
            details: details,
            __proto__: null//making output more readable
        };

        //#FBB1157 color is named "Beer" and #6F4E37 is named "Coffee". Quite amazingly, they work together nicely.
        window.console.debug('%cDOM change: %c' + name, 'color: #FBB117; font-weight: bold', 'color: #6F4E37', details);
    }

    function onMutation(records) {
        var record, i, l;

        for (i = 0, l = records.length; i < l; i++) {
            record = records[i];

            if (record.type === 'childList') {
                if (record.addedNodes.length) {
                    logEvent('nodes added', {
                        target: record.target,
                        nodes: record.addedNodes
                    });
                } else if (record.removedNodes.length) {
                    logEvent('nodes removed', {
                        target: record.target,
                        nodes: record.removedNodes
                    });
                }
            } else if (record.type === 'attributes') {
                logEvent('attribute change', {
                    target: record.target,
                    attribute: record.attributeName,
                    oldValue: record.oldValue,
                    newValue: record.target.getAttribute(record.attributeName)
                });
            } else if (record.type === 'characterData') {
                logEvent('data change', {
                    target: record.target,
                    newValue: record.target.data,
                    oldValue: record.oldValue
                });
            }
        }
    }

    if (!window.domListenerExtension) {
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

        if (typeof MutationObserver !== 'function') {
            console.error('DOM Listener Extension: MutationObserver is not available in your browser.');
            return;
        }

        var observer = new MutationObserver(onMutation);

        window.domListenerExtension = {
            _connected: false,
            isConnected: function() {
                return this._connected;
            },
            observe: function() {
                observer.disconnect();
                observer.observe(document, {
                    childList: true,
                    attributes: true,
                    subtree: true,
                    characterData: true,
                    characterDataOldValue: true
                });
                this._connected = true;

                window.console.debug('%cDOM Listener connected.', 'color: #FBB117; font-weight: bold');
            },
            disconnect: function() {
                observer.disconnect();
                this._connected = false;

                window.console.debug('%cDOM Listener disconnected.', 'color: #FBB117; font-weight: bold');
            }
        };
    }

    if(!window.domListenerExtension.isConnected()) {
        window.domListenerExtension.observe();
    }
})();