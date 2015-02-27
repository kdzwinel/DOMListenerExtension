DOMListener
======================

DOMListener is a simple tool that provides convenient interface for observing DOM changes (node removal and addition, attribute and text modifications). Events can be filtered with ease, affected nodes can be highlighted with a single click.

![Screenshot](https://github.com/kdzwinel/DOMListenerExtension/blob/master/ico/screenshot1.png?raw=true)

Installation
-----

You can get this extension in the [Chrome Web Store](https://chrome.google.com/webstore/detail/domlistener/jlfdgnlpibogjanomigieemaembjeolj) or [download it from github](https://github.com/kdzwinel/DOMListenerExtension/archive/master.zip) and manually load as an 'Unpacked extension' via chrome extensions page.

Usage
-----

Open Chrome DevTools and navigate to the "DOMListener" panel. From here you can:

- start listening/recording DOM changes ("Record" button),
- filter types of events using checkboxes in the top left corner,
- filter nodes by providing a search query in the input field,
- highlight nodes by clicking on their names and
- inspect nodes by holding Shift and clicking on their names.

How does it work?
-----
[MutationObserver](https://developer.mozilla.org/en/docs/Web/API/MutationObserver).


Bugs and Features
-----------------

If you found a bug or have a feature request, please create an issue here on GitHub.

https://github.com/kdzwinel/DOMListenerExtension/issues

Thanks to
------

**Sunil Agrawal** for [inspiration](http://stackoverflow.com/questions/18821336/a-browser-extension-to-dump-all-dom-method-calls)

Author
------

**Konrad Dzwinel**

+ https://twitter.com/kdzwinel

License
-------

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
