"use strict";


const average = (array) => array.reduce((a, b) => a + b) / array.length;

onmessage = function (e) {

    // Turning frequency array results into percentages
    const frequencyData = e.data.map( x => x/255*100 );

    const range = {
        sub: frequencyData.slice(0,2),             //    20 to 60Hz
        bass: frequencyData.slice(3,11),           //    60 to 250Hz
        low: frequencyData.slice(12,23),           //   250 to 500Hz
        mid: frequencyData.slice(24,92),           //   500 to 2kHz
        high: frequencyData.slice(93,185),         //    2k to 4kHz
        presence: frequencyData.slice(186,278),    //    4k to 6kHz
        brilliance: frequencyData.slice(279)       //    6k to 20kHz
    };

    const stats = {
        max: Math.max(...frequencyData),
        min: isFinite(Math.min(...frequencyData.filter(Boolean))) ? Math.min(...frequencyData.filter(Boolean)) : 0,
        avg: parseInt(average(frequencyData))
    };

    stats.range = parseInt(stats.max) - parseInt(stats.min);

    for (let row of Object.keys(range)) {
        stats[`${row}_max`]   = Math.max(...range[row]);
        stats[`${row}_min`]   = isFinite(Math.min(...range[row].filter(Boolean))) ? Math.min(...range[row].filter(Boolean)) : 0;
        stats[`${row}_avg`]   = parseInt(average(range[row]));
        stats[`${row}_range`] = parseInt(stats[`${row}_max`]) - parseInt(stats[`${row}_min`]);
    }

    postMessage(stats);

};
