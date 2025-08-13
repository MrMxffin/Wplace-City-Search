// ==UserScript==
// @name         Wplace City Search
// @namespace    http://tampermonkey.net/
// @version      0.1.0
// @description  Adds a City Search for wplace.live
// @author       MxMxffin
// @match        *://*.wplace.live/*
// @grant        GM_xmlhttpRequest
// @connect      nominatim.openstreetmap.org
// ==/UserScript==

(function () {
    'use strict';

    //create a centered div
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "10px";
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
    container.style.zIndex = 9999;
    container.style.background = "white";
    container.style.padding = "5px";
    container.style.border = "1px solid black";
    container.style.borderRadius = "5px";
    container.style.width = "250px";
    container.style.fontFamily = "sans-serif";

    //put the input bar inside
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Search location...";
    input.style.width = "100%";
    input.style.boxSizing = "border-box";
    input.style.padding = "5px";

    //suggestion box for the dropdown below
    const suggestionBox = document.createElement("div");
    suggestionBox.style.position = "absolute";
    suggestionBox.style.top = "40px";
    suggestionBox.style.left = "0";
    suggestionBox.style.width = "100%";
    suggestionBox.style.background = "white";
    suggestionBox.style.border = "1px solid black";
    suggestionBox.style.borderTop = "none";
    suggestionBox.style.maxHeight = "200px";
    suggestionBox.style.overflowY = "auto";
    suggestionBox.style.display = "none";
    suggestionBox.style.fontSize = "14px";

    container.appendChild(input);
    container.appendChild(suggestionBox);
    document.body.appendChild(container);

    let debounceTimer;
    function debounce(func, delay) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(func, delay);
    }

    function fetchSuggestions(query) {
        if (!query) {
            suggestionBox.style.display = "none";
            return;
        }
        //get 5 suggestions
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`;

        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            onload: function (response) {
                try {
                    const results = JSON.parse(response.responseText);
                    renderSuggestions(results);
                } catch (err) {
                    console.error("Error parsing response", err);
                }
            }
        });
    }

    function renderSuggestions(results) {
        suggestionBox.innerHTML = "";

        if (results.length === 0) {
            suggestionBox.style.display = "none";
            return;
        }

        const seen = new Set();

        results.forEach(place => {
            let name = place.display_name.split(",")[0].trim();
            const country = (place.address.country || "").trim();

            // If the country is the result don't display the country in parenthesis
            if (name.toLowerCase() === country.toLowerCase()) {
                name = country;
            }

            const key = `${name.toLowerCase()}|${country.toLowerCase()}`;
            if (seen.has(key)) return; // skip duplicates
            seen.add(key);

            const lat = place.lat;
            const lon = place.lon;

            const item = document.createElement("div");
            item.style.padding = "5px";
            item.style.cursor = "pointer";
            item.style.borderBottom = "1px solid #ddd";
            item.textContent = country && name !== country
                ? `${name} (${country})`
            : name;

            item.addEventListener("mouseover", () => {
                item.style.background = "#eee";
            });
            item.addEventListener("mouseout", () => {
                item.style.background = "white";
            });

            item.addEventListener("click", () => {
                window.location.href = `https://wplace.live/?lat=${lat}&lng=${lon}`;
            });

            suggestionBox.appendChild(item);
        });

        suggestionBox.style.display = suggestionBox.children.length > 0 ? "block" : "none";
    }


    input.addEventListener("input", () => {
        //300 ms delay before making a fetch request to reduce stress on nominatim
        debounce(() => fetchSuggestions(input.value.trim()), 300);
    });

    document.addEventListener("click", (e) => {
        if (!container.contains(e.target)) {
            suggestionBox.style.display = "none";
        }
    });

})();