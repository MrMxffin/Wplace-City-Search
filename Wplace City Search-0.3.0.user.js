// ==UserScript==
// @name         Wplace City Search
// @namespace    http://tampermonkey.net/
// @version      0.3.0
// @description  Adds a City Search for wplace.live
// @author       MxMxffin
// @match        *://wplace.live/*
// @grant        GM_xmlhttpRequest
// @connect      nominatim.openstreetmap.org
// ==/UserScript==

(function () {
    'use strict';

    // --- Container ---
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "10px";
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
    container.style.zIndex = 9999;
    container.style.fontFamily = "sans-serif";

    // --- Morphing button/input ---
    const searchMorph = document.createElement("div");
    searchMorph.style.width = "40px";
    searchMorph.style.height = "40px";
    searchMorph.style.borderRadius = "50%";
    searchMorph.style.background = "#1a1a1a";
    searchMorph.style.display = "flex";
    searchMorph.style.alignItems = "center";
    searchMorph.style.justifyContent = "center";
    searchMorph.style.cursor = "pointer";
    searchMorph.style.transition = "all 0.3s ease";
    searchMorph.style.position = "relative";
    searchMorph.style.boxShadow = "0 2px 5px rgba(0,0,0,0.3)";
    container.appendChild(searchMorph);
    document.body.appendChild(container);

    // --- Magnifying glass icon ---
    const icon = document.createElement("span");
    icon.innerHTML = "🔍";
    icon.style.fontSize = "18px";
    icon.style.color = "white";
    icon.style.transition = "opacity 0.2s ease";
    searchMorph.appendChild(icon);

    // --- Input field inside morphing container ---
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Search location...";
    input.style.width = "0px";
    input.style.border = "none";
    input.style.outline = "none";
    input.style.background = "transparent";
    input.style.color = "white";
    input.style.fontSize = "14px";
    input.style.padding = "0px";
    input.style.transition = "all 0.3s ease";
    input.style.position = "absolute";
    input.style.left = "12px";
    input.style.opacity = "0";
    searchMorph.appendChild(input);

    // --- Suggestion box ---
    const suggestionBox = document.createElement("div");
    suggestionBox.style.position = "absolute";
    suggestionBox.style.top = "50px";
    suggestionBox.style.left = "0";
    suggestionBox.style.width = "100%";
    suggestionBox.style.background = "#1a1a1a";
    suggestionBox.style.border = "1px solid #555";
    suggestionBox.style.borderTop = "none";
    suggestionBox.style.maxHeight = "200px";
    suggestionBox.style.overflowY = "auto";
    suggestionBox.style.display = "none";
    suggestionBox.style.fontSize = "14px";
    suggestionBox.style.borderRadius = "0 0 10px 10px";
    container.appendChild(suggestionBox);

    // --- Morph animation ---
    searchMorph.addEventListener("click", () => {
        searchMorph.style.width = "220px";
        searchMorph.style.borderRadius = "20px";
        icon.style.opacity = "0";
        input.style.width = "calc(100% - 24px)";
        input.style.padding = "8px 12px";
        input.style.opacity = "1";
        input.focus();
    });

    // --- Collapse on blur ---
    input.addEventListener("blur", () => {
        setTimeout(() => {
            if (document.activeElement !== input) {
                searchMorph.style.width = "40px";
                searchMorph.style.borderRadius = "50%";
                icon.style.opacity = "1";
                input.style.width = "0px";
                input.style.padding = "0px";
                input.style.opacity = "0";
                suggestionBox.style.display = "none";
            }
        }, 100);
    });

    // --- Debounce ---
    let debounceTimer;
    function debounce(func, delay) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(func, delay);
    }

    // --- Fetch suggestions ---
    function fetchSuggestions(query) {
        if (!query) {
            suggestionBox.style.display = "none";
            return;
        }
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

            if (name.toLowerCase() === country.toLowerCase()) name = country;

            const key = `${name.toLowerCase()}|${country.toLowerCase()}`;
            if (seen.has(key)) return;
            seen.add(key);

            const lat = place.lat;
            const lon = place.lon;

            const item = document.createElement("div");
            item.style.padding = "5px";
            item.style.cursor = "pointer";
            item.style.borderBottom = "1px solid #333";
            item.style.color = "white";
            item.textContent = country && name !== country ? `${name} (${country})` : name;

            item.addEventListener("mouseover", () => item.style.background = "#333");
            item.addEventListener("mouseout", () => item.style.background = "transparent");
            item.addEventListener("click", () => window.location.href = `https://wplace.live/?lat=${lat}&lng=${lon}`);

            suggestionBox.appendChild(item);
        });

        suggestionBox.style.display = suggestionBox.children.length > 0 ? "block" : "none";
    }

    input.addEventListener("input", () => {
        debounce(() => fetchSuggestions(input.value.trim()), 300);
    });

    // Close suggestions if click outside
    document.addEventListener("click", (e) => {
        if (!container.contains(e.target)) {
            suggestionBox.style.display = "none";
        }
    });

})();
