function get_width() {
    return browser.storage.local.get({
        width: 1280
    }).then(function(items) {
        return items.width;
    });
}

function set_width(num) {
    return browser.storage.local.set({
        width: num
    }).then(function() {
        rezoom_all(num)
        return num;
    });
}

function round(num) {
    return Math.round(num * 100) / 100;
}

function rezoom(tab, width) {
    browser.windows.get(tab.windowId).then(function(window) {
        if (window.focused != true) {
            return
        }
        if (window.type != 'normal') {
            return
        }
        var zoom_level = 1;

        if (width != 0) {
            zoom_level = tab.width / width
            zoom_level = Math.max(0.3, Math.min(zoom_level, 3));
        }

        browser.tabs.getZoom(tab.id).then(function(current_zoom) {
            if (round(current_zoom) != round(zoom_level)) {
                browser.tabs.setZoom(tab.id, zoom_level)
            }
        });
    });
}

function rezoom_all(width) {
    browser.tabs.query({
        "active": true,
    }, function(tabs) {
        for (tabData in tabs) {
            rezoom(tabs[tabData], width);
        }
    });
}

browser.commands.onCommand.addListener(function(command) {
    if (command == "increase-dynamic-zoom") {
        get_width().then(function(width) {
            var new_width = width * 1.2
            set_width(new_width);
        });
    } else if (command == "decrease-dynamic-zoom") {
        get_width().then(function(width) {
            var new_width = width * 0.8
            set_width(new_width);
        });
    }
});

// set zoom the user switches tabs
browser.tabs.onActivated.addListener(function(activeInfo) {
    browser.tabs.get(activeInfo.tabId, function(tab) {
        get_width().then(function(width) {
            rezoom(tab, width)
        });
    });
});

// set zoom the user navigates to a new url
browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    get_width().then(function(width) {
        rezoom(tab, width);
    });
});

// set zoom when the window is resized
browser.runtime.onMessage.addListener(function(message, sender) {
    if (message.greeting === "resize") {
        get_width().then(rezoom_all);
    }
});

// set zoom when the window focus changes
browser.windows.onFocusChanged.addListener(function(windowId) {
    get_width().then(rezoom_all);
});

// set zoom intermittantly (just in case I missed something)
setInterval(function() {
    get_width().then(rezoom_all);
}, 30 * 1000);

// set zoom when extension starts
get_width().then(rezoom_all);