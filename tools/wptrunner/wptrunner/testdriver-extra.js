"use strict";

(function(){
    let pending_resolve = null;
    let pending_reject = null;
    window.addEventListener("message", function(event) {
        const data = event.data;

        if (typeof data !== "object" && data !== null) {
            return;
        }

        if (data.type !== "testdriver-complete") {
            return;
        }

        if (data.status === "success") {
            pending_resolve();
        } else {
            pending_reject();
        }
    });

    const get_selector = function(element) {
        let selector;

        if (element.id && document.getElementById(element.id) === element) {
            const id = element.id;

            selector = "#";
            // escape everything, because it's easy to implement
            for (let i = 0, len = id.length; i < len; i++) {
                selector += '\\' + id.charCodeAt(i).toString(16) + ' ';
            }
        } else {
            // push and then reverse to avoid O(n) unshift in the loop
            let segments = [];
            for (let node = element;
                 node.parentNode && node.parentNode.nodeType == Node.ELEMENT_NODE;
                 node = node.parentNode) {
                let segment = "*|" + node.localName;
                let nth = Array.prototype.indexOf.call(node.parentNode.children, node) + 1;
                segments.push(segment + ":nth-child(" + nth + ")");
            }
            segments.push(":root");
            segments.reverse();

            selector = segments.join(" > ");
        }

        return selector;
    };

    window.test_driver = {
        click: function(element) {
            const selector = get_selector(element);
            const pending_promise = new Promise(function(resolve, reject) {
                pending_resolve = resolve;
                pending_reject = reject;
            });
            window.opener.postMessage({"type": "action", "action": "click", "selector": selector}, "*");
            return pending_promise;
        }
    };
})();
