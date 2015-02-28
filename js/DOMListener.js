(function () {
    "use strict";

    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

    if (typeof MutationObserver !== 'function') {
        console.error('DOM Listener Extension: MutationObserver is not available in your browser.');
        return;
    }

    function Higlighter() {
        var canvas = document.createElement('canvas');
        canvas.setAttribute('id', 'domListenerExtensionCanvas');

        canvas.style.position = 'fixed';
        canvas.style.left = '0';
        canvas.style.top = '0';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.zIndex = '100000';
        canvas.style.pointerEvents = 'none';

        document.body.appendChild(canvas);

        window.addEventListener('resize', function () {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        this._canvas = canvas;
        this._ctx = canvas.getContext('2d');
        this._highlights = [];

        requestAnimationFrame(this._animate.bind(this));
    }

    Higlighter.prototype._animate = function () {
        var canvas = this._canvas;
        var context = this._ctx;

        context.clearRect(0, 0, canvas.width, canvas.height);

        this._highlights = (this._highlights).filter(function (item) {
            return (item.time > 0);
        });

        this._highlights.forEach(function (item) {
            if(item.left > 0 && item.top > 0 && item.left < canvas.width && item.top < canvas.height) {
                context.fillStyle = 'rgba(' + item.color.r + ', ' + item.color.g + ', ' + item.color.b + ',' + (item.time/50) + ')';
                context.fillRect(item.left, item.top, item.width, item.height);
            }

            item.time--;
        });

        if(this._highlights.length) {
            requestAnimationFrame(this._animate.bind(this));
        }
    };

    Higlighter.prototype.highlightNode = function(node, color) {
        for(var i= 0, l=this._highlights.length; i<l; i++) {
            if((this._highlights[i]).id === node) {
                (this._highlights[i]).time = 30;
                return;
            }
        }

        color = color || {r: 51, g: 195, b: 240};

        if (node && node.nodeName === '#text') {
            this.highlightNode(node.parentNode, color);
        } else if (node && node.getBoundingClientRect) {
            var bounding = node.getBoundingClientRect();
            this.highlight(node, bounding.left, bounding.top, bounding.width, bounding.height, color);
        }
    };

    Higlighter.prototype.highlight = function (id, left, top, width, height, color) {
        if(this._highlights.length === 0) {
            requestAnimationFrame(this._animate.bind(this));
        }

        (this._highlights).push({
            id: id,
            left: left,
            top: top,
            width: width,
            height: height,
            color: color,
            time: 30
        });
    };

    var highlighter = new Higlighter();

    var observer = new MutationObserver(onMutation);
    var observerSettings = {
        subtree: true,
        childList: true,
        attributes: true,
        attributeOldValue: true,
        characterData: true,
        characterDataOldValue: true
    };

    var nodeRegistry = [];

    var bgPageConnection = chrome.runtime.connect({
        name: "content-script"
    });

    bgPageConnection.postMessage({
        type: 'connected'
    });

    function nodeToSelector(node, contextNode) {
        if (node.id) {
            return '#' + node.id;
        } else if (node.classList && node.classList.length) {
            return node.tagName + '.' + Array.prototype.join.call(node.classList, '.');
        } else if (node.parentElement && node.parentElement !== contextNode) {
            var parentSelector = nodeToSelector(node.parentElement, contextNode);

            if (node.nodeName === '#comment') {
                return parentSelector + ' > (comment)';
            } else if (node.nodeName === '#text') {
                return parentSelector + ' > (text)';
            } else {
                return parentSelector + ' > ' + node.nodeName;
            }
        } else if (node.nodeName) {
            if (node.nodeName === '#comment') {
                return '(comment)';
            } else if (node.nodeName === '#text') {
                return '(text)';
            } else {
                return node.nodeName;
            }
        } else {
            return '(unknown)';
        }
    }

    function nodesToObjects(nodes, contextNode) {
        return Array.prototype.map.call(nodes, function (node) {
            return nodeToObject(node, contextNode);
        });
    }

    function nodeToObject(node, contextNode) {
        var nodeId = nodeRegistry.indexOf(node);

        if (nodeId === -1) {
            nodeRegistry.push(node);
            nodeId = nodeRegistry.length - 1;
        }

        return {
            selector: nodeToSelector(node, contextNode),
            nodeId: nodeId
        };
    }

    function logEvent(event) {
        bgPageConnection.postMessage({
            type: 'event',
            event: event
        });
    }

    function isAttached(node) {
        if (node === document || document.contains(node)) {
            return true;
        } else if (node.parentNode) {
            return isAttached(node.parentNode);
        } else if (node.host) {
            return isAttached(node.host);
        }

        return false;
    }

    function cleanUpNodeRegistry() {
        //get rid of detached nodes
        for (var i = 0, l = nodeRegistry.length; i < l; i++) {
            var node = nodeRegistry[i];

            if (node && !isAttached(node)) {
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
                        nodes: nodesToObjects(record.addedNodes, record.target)
                    });

                    Array.prototype.forEach.call(record.addedNodes, function (node) {
                        highlighter.highlightNode(node, {r: 138, g: 219, b: 246});

                        findShadowRoots(node).forEach(function (shadowRoot) {
                            observer.observe(shadowRoot, observerSettings);
                        });
                    });
                }

                if (record.removedNodes.length) {
                    logEvent({
                        type: 'nodes removed',
                        target: nodeToObject(record.target),
                        nodes: nodesToObjects(record.removedNodes, record.target)
                    });

                    cleanUpNodeRegistry();
                    highlighter.highlightNode(record.target, {r: 255, g: 198, b: 139});
                }
            } else if (record.type === 'attributes') {
                logEvent({
                    type: 'attribute changed',
                    target: nodeToObject(record.target),
                    attribute: record.attributeName,
                    oldValue: record.oldValue,
                    newValue: record.target.getAttribute(record.attributeName)
                });

                highlighter.highlightNode(record.target, {r: 179, g: 146, b: 248});
            } else if (record.type === 'characterData') {
                logEvent({
                    type: 'text changed',
                    target: nodeToObject(record.target),
                    newValue: record.target.data,
                    oldValue: record.oldValue
                });

                highlighter.highlightNode(record.target, {r: 254, g: 239, b: 139});
            } else {
                console.error('DOM Listener Extension: unknown type of event', record);
            }
        }
    }

    function findShadowRoots(node, list) {
        list = list || [];

        if (node.shadowRoot) {
            list.push(node.shadowRoot);
        }

        if (node && node.querySelectorAll) {
            Array.prototype.forEach.call(node.querySelectorAll('*'), function (child) {
                if (child.tagName && child.tagName.indexOf('-') > -1 && child.shadowRoot) {
                    findShadowRoots(child, list)
                }
            });
        }

        return list;
    }

    if (!window.domListenerExtension) {
        window.domListenerExtension = {
            startListening: function () {
                observer.disconnect();

                //observe the main document
                observer.observe(document, observerSettings);

                //observe all shadow roots
                findShadowRoots(document).forEach(function (shadowRoot) {
                    observer.observe(shadowRoot, observerSettings);
                });
            },
            stopListening: function () {
                observer.disconnect();
            },
            getNode: function (nodeId) {
                return nodeRegistry[nodeId];
            },
            highlightNode: function (nodeId) {
                var node = this.getNode(nodeId);
                highlighter.highlightNode(node);
            }
        };
    }
})();
