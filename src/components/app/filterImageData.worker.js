import {FILTER_OPTION} from "./enums";

const optionToFunctionMap = new Map([
    [FILTER_OPTION.SEPIA, sepiaFilterByPixel],
    [FILTER_OPTION.GRAYSCALE, grayscaleFilterByPixel],
    [FILTER_OPTION.INVERT, invertFilterByPixel],
    [FILTER_OPTION.OPACITY, opacityFilterByPixel]
]);

/**
 * @param option - option to filter by
 * @param imageData - data to filter
 * @returns {ImageData|*} - new filtered ImageData Object
 * If filter option is not none, filter the image data
 * by the given option for every pixel.
 */
function getFilteredImageData(option, imageData) {
    if (option !== FILTER_OPTION.NONE) {
        const {data} = imageData;
        const filterFn = optionToFunctionMap.get(option);
        for (let i = 0; i < data.length; i += 4) { // iterate over each pixel
            const [r, g, b, a] = filterFn(data[i], data[i + 1], data[i + 2], data[i + 3]);
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
            data[i + 3] = a;
        }
    }
    return imageData;
}

// Filter Functions:
//  Takes in as parameter 4 RGBA integer values
//  representing a single pixel. Returns an arr
//  representing the new filtered pixel.

// https://www.techrepublic.com/blog/how-do-i/how-do-i-convert-images-to-grayscale-and-sepia-tone-using-c/
function sepiaFilterByPixel(r, g, b, a) {
    const newR = colorify((r * .393) + (g * .769) + (b * .189));
    const newG = colorify((r * .349) + (g * .686) + (b * .168));
    const newB = colorify((r * .272) + (g * .534) + (b * .131));
    return [newR, newG, newB, a];
}

// https://stackoverflow.com/questions/53364140/how-can-i-grayscale-a-canvas-image-in-javascript
function grayscaleFilterByPixel(r, g, b, a) {
    const avg = (r + g + b)/3;
    return [avg, avg, avg, a];
}

//https://www.homeandlearn.co.uk/extras/image/image-invert-colors.html
function invertFilterByPixel(r, g, b, a) {
    return [255 - r, 255 - g, 255 - b, a];
}

function opacityFilterByPixel(r, g, b, a) {
    return [r, g, b, 125];
}

/**
 * @param num - any number
 * @returns {number} - a valid integer for colors
 * Rounds and bounds a number into a valid
 * integer for colors.
 */
function colorify(num) {
    num = Math.round(num);
    if (num < 0) {
        return 0;
    }
    if (num > 255) {
        return 255;
    }
    return num;
}

// retrieve data from main thread
// execute costly pixel manipulation in worker thread
// send result back to main thread
self.addEventListener("message", e => {
    const {currentFilterOption, imageData} = e.data;
    self.postMessage(getFilteredImageData(currentFilterOption, imageData));
});


