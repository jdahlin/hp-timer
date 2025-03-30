/**
 * Configuration for HP Timer
 * Contains test section definitions and settings
 */

// Test section configurations
const VERBAL_SECTIONS = [
    { name: "ORD", items: 10, timePerItem: 18 },
    { name: "LÄS", items: 10, timePerItem: 132 },
    { name: "MEK", items: 10, timePerItem: 48 },
    { name: "ELF", items: 10, timePerItem: 132 }
];

const KVANTITATIV_SECTIONS = [
    { name: "XYZ", items: 12, timePerItem: 60 },
    { name: "KVA", items: 10, timePerItem: 60 },
    { name: "NOG", items: 6, timePerItem: 100 },
    { name: "DTK", items: 12, timePerItem: 115 }
];

// Default settings
const DEFAULT_SETTINGS = {
    totalTime: 55, // minutes
    reserveTimePercentage: 15
};

// DOM element selector helper
const $ = id => document.getElementById(id);
