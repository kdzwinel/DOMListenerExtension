(function () {
    "use strict";

    function formatNode(node) {
        return '<span class="node" data-nodeid="' + node.nodeId + '">' + node.selector + '</span>';
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

    function EventTable(table) {
        this._tableHead = table.tHead;
        this._tableBody = table.tBodies[0];
        this._counter = this._tableHead.querySelector('.counter');
        this._targetFilter = (this._tableHead).querySelector('.target-filter');
        this._count = this._tableBody.children.length;

        //FILTERS

        var thead = this._tableHead;
        var tbody = this._tableBody;
        var targetFilter = this._targetFilter;
        var typeFilters = (this._tableHead).querySelectorAll('.type-filters input');

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

        updateTypeFilters();

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

        updateTargetFilter();

        targetFilter.addEventListener('keyup', updateTargetFilter);

        for (var i = 0, l = typeFilters.length; i < l; i++) {
            typeFilters[i].addEventListener('change', updateTypeFilters);
        }
    }

    EventTable.prototype._updateEventCounter = function () {
        (this._counter).innerText = '(' + this._count + ')';
    };

    EventTable.prototype.clear = function () {
        (this._tableBody).innerHTML = '';

        this._count = 0;
        this._updateEventCounter();
    };

    EventTable.prototype.addEvent = function (event) {
        var tr = document.createElement('tr');
        var tdTarget = document.createElement('td');
        var tdAction = document.createElement('td');
        var tdDetails = document.createElement('td');

        tr.appendChild(tdAction);
        tr.appendChild(tdTarget);
        tr.appendChild(tdDetails);

        tdTarget.innerHTML = formatNode(event.target);

        var query = ((this._targetFilter).value).trim();
        if (!query || tdTarget.innerText.indexOf(query) > -1) {
            tr.classList.add('target-match');
        }

        tdAction.innerText = event.type;

        var details = "";
        switch (event.type) {
            case "nodes added":
                details = event.nodes.length + ' node(s) added: ' +
                '<em>' + (event.nodes.map(formatNode)).join('</em>, <em>') + '</em>';

                tr.classList.add('nodes-added');
                break;
            case "nodes removed":
                details = event.nodes.length + ' node(s) removed: ' +
                '<em>' + (event.nodes.map(formatNode)).join('</em>, <em>') + '</em>';

                tr.classList.add('nodes-removed');
                break;
            case "attribute changed":
                details = '<em>"' + event.attribute + '"</em> changed ' +
                'from <em>' + formatValue(event.oldValue) + '</em> ' +
                'to <em>' + formatValue(event.newValue) + '</em>';

                tr.classList.add('attribute-changed');
                break;
            case "text changed":
                details = 'text changed ' +
                'from <em>' + formatValue(event.oldValue) + '</em> ' +
                'to <em>' + formatValue(event.newValue) + '</em>';

                tr.classList.add('text-changed');
                break;
        }

        tdDetails.innerHTML = details;

        //insert at the top/beginning
        this._tableBody.insertBefore(tr, this._tableBody.firstChild);

        tr.animate([
            {opacity: 0},
            {opacity: 1}
        ], 300);

        this._count++;
        this._updateEventCounter();
    };

    window.EventTable = EventTable;
})();
