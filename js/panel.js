var statusElem = document.querySelector('.status');
var clearBtn = document.querySelector('.clear');
var topBtn = document.querySelector('.top');
var recordBtn = document.querySelector('.record');
var thead = document.querySelector('.events thead');
var tbody = document.querySelector('.events tbody');
var typeFilters = document.querySelectorAll('.type-filters input');
var targetFilter = document.querySelector('.target-filter');
var eventCounter = document.querySelector('.events thead .counter');

function injectContentScript() {
    // Send the tab ID to the background page
    bgPageConnection.postMessage({
        type: 'inject',
        tabId: chrome.devtools.inspectedWindow.tabId,
        scriptToInject: "js/DOMListener.js"
    });
}

function clearList() {
    tbody.innerHTML = '';
    updateEventCounter();
}

function toTheTop() {
    var scrollPos = document.body.scrollTop;

    if (scrollPos === 0) {
        return;
    }

    document.body.scrollTop -= (scrollPos > 10) ? (scrollPos / 4) : 10;
    requestAnimationFrame(toTheTop);
}

function updateEventCounter() {
    eventCounter.innerText = '(' + tbody.children.length + ')';
}

function updateTypeFilters() {
    var nodesAdded = thead.querySelector('.nodes-added input').checked;
    var nodesRemoved = thead.querySelector('.nodes-removed input').checked;
    var textChanged = thead.querySelector('.text-changed input').checked;
    var attributeChanged = thead.querySelector('.attribute-changed input').checked;

    if (nodesAdded) {
        tbody.classList.add('nodes-added-visible');
    } else {
        tbody.classList.remove('nodes-added-visible');
    }

    if (nodesRemoved) {
        tbody.classList.add('nodes-removed-visible');
    } else {
        tbody.classList.remove('nodes-removed-visible');
    }

    if (textChanged) {
        tbody.classList.add('text-changed-visible');
    } else {
        tbody.classList.remove('text-changed-visible');
    }

    if (attributeChanged) {
        tbody.classList.add('attribute-changed-visible');
    } else {
        tbody.classList.remove('attribute-changed-visible');
    }
}

function updateTargetFilter() {
    var query = (targetFilter.value).trim();

    for (var i = 0, l = tbody.children.length; i < l; i++) {
        var tr = tbody.children[i];
        var targetTd = tr.children[1];

        if (!query || targetTd.innerText.indexOf(query) > -1) {
            tr.classList.add('target-match');
        } else {
            tr.classList.remove('target-match');
        }
    }
}

function formatValue(value) {
    if (value === null) {
        return 'null';
    } else if (value === undefined) {
        return 'undefined';
    } else {
        return '"' + value + '"';
    }
}

function inspectNode(nodeId) {
    chrome.devtools.inspectedWindow.eval(
        'inspect(domListenerExtension.getNode(' + nodeId + '))',
        {useContentScriptContext: true}
    );
}

function highlightNode(nodeId) {
    chrome.devtools.inspectedWindow.eval(
        'domListenerExtension.highlightNode(' + nodeId + ')',
        {useContentScriptContext: true}
    );
}

function startRecording() {
    chrome.devtools.inspectedWindow.eval(
        'domListenerExtension.startListening()',
        {useContentScriptContext: true}
    );
}

function stopRecording() {
    chrome.devtools.inspectedWindow.eval(
        'domListenerExtension.stopListening()',
        {useContentScriptContext: true}
    );
}

function formatNode(node) {
    return '<span class="node" data-nodeid="' + node.nodeId + '">' + node.selector + '</span>';
}

var recording = false;
recordBtn.addEventListener('click', function () {
    recording = !recording;

    recordBtn.innerText = recording ? 'Stop' : 'Record';

    if (recording) {
        startRecording();
    } else {
        stopRecording();
    }
});

clearBtn.addEventListener('click', clearList);

targetFilter.addEventListener('keyup', updateTargetFilter);

topBtn.addEventListener('click', toTheTop);

tbody.addEventListener('click', function (e) {
    var target = e.target;

    if (target && target.classList.contains('node') && target.dataset.nodeid) {
        if (e.shiftKey) {
            inspectNode(target.dataset.nodeid);
        } else {
            highlightNode(target.dataset.nodeid);
        }
    }
});

var scrollPos = 0;
document.addEventListener('scroll', function () {
    scrollPos = document.body.scrollTop;
});

function updateTopBtn() {
    if (scrollPos > 0) {
        topBtn.classList.remove('hidden');
    } else {
        topBtn.classList.add('hidden');
    }
    requestAnimationFrame(updateTopBtn);
}
updateTopBtn();


for (var i = 0, l = typeFilters.length; i < l; i++) {
    typeFilters[i].addEventListener('change', updateTypeFilters);
}

var bgPageConnection = chrome.runtime.connect({
    name: "devtools-page"
});

bgPageConnection.onMessage.addListener(function (message) {
    if (message.type === 'connected') {
        statusElem.classList.add('connected');

        clearList();

        if (recording) {
            startRecording();
        }
    } else if (message.type === 'disconnected') {
        statusElem.classList.remove('connected');

        injectContentScript();
    } else if (message.type === 'event') {
        var event = message.event;

        var tr = document.createElement('tr');
        var tdTarget = document.createElement('td');
        var tdAction = document.createElement('td');
        var tdDetails = document.createElement('td');

        tr.appendChild(tdAction);
        tr.appendChild(tdTarget);
        tr.appendChild(tdDetails);

        tdTarget.innerHTML = formatNode(event.target);

        var query = (targetFilter.value).trim();
        if (!query || tdTarget.innerText.indexOf(query) > -1) {
            tr.classList.add('target-match');
        }

        tdAction.innerText = event.type;

        var details = "";
        switch (event.type) {
            case "nodes added":
                details = event.nodes.length + ' node(s) added: <em>' + (event.nodes.map(formatNode)).join('</em>, <em>') + '</em>';
                tr.classList.add('nodes-added');
                break;
            case "nodes removed":
                details = event.nodes.length + ' node(s) removed: <em>' + (event.nodes.map(formatNode)).join('</em>, <em>') + '</em>';
                tr.classList.add('nodes-removed');
                break;
            case "attribute changed":
                details = '<em>"' + event.attribute + '"</em> changed from <em>' + formatValue(event.oldValue) + '</em> to <em>' + formatValue(event.newValue) + '</em>';
                tr.classList.add('attribute-changed');
                break;
            case "text changed":
                details = 'text changed from <em>' + formatValue(event.oldValue) + '</em> to <em>' + formatValue(event.newValue) + '</em>';
                tr.classList.add('text-changed');
                break;
        }

        tdDetails.innerHTML = details;

        tbody.insertBefore(tr, tbody.firstChild);

        tr.animate([
            {opacity: 0},
            {opacity: 1}
        ], 300);

        updateEventCounter();
    }
});

injectContentScript();
updateTypeFilters();
updateTargetFilter();
