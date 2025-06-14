const toggle = document.getElementById('toggleMenu');

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getExportMenuState' }, function(response) {
        if (response && typeof response.visible === "boolean") {
            toggle.checked = response.visible;
        }
    });
});

toggle.addEventListener('change', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(
            tabs[0].id,
            { action: 'setExportMenuState', visible: toggle.checked }
        );
    });
});