import Puppeteer from 'puppeteer';
import {FILTER_OPTION} from "./enums";

describe("App", () => {
    let page;

    beforeEach(async () => {
        const browser = await Puppeteer.launch();
        page = await browser.newPage();
        await page.goto("http://localhost:3000/", {waitUntil: 'networkidle0'});
    }, 30000);

    async function uploadFile() {
        const input = await page.$('input[type="file"]');
        await input.uploadFile('./src/images/virtual-scroll-example.png');
        await page.$eval('input[type="file"]', input => {
            const event = new Event('change', {bubbles: true});
            input.dispatchEvent(event);
        });
    }

    it("should display a download button on input change", async() => {
        let button = await page.$("button");
        expect(button).toBeFalsy();

        await uploadFile();

        button = await page.$("button");
        expect(button).toBeTruthy();
    });

    async function screenshot(name) {
        await page.screenshot({path: `./src/images/${name}.png`, fullPage: true});
    }

    async function getCanvas() {
        return await page.$eval("canvas", canvas => {
            const context = canvas.getContext("2d");
            return context.getImageData(0,0, canvas.width, canvas.height).data;
        });
    }

    it("should display a canvas with same aspect ratio as uploaded image", async() => {
        await uploadFile();
        const width = await page.$eval('canvas', canvas => canvas.width);
        const height = await page.$eval('canvas', canvas => canvas.height);
        expect(width/height).toBeCloseTo(623/560);
    });

    it("should update the canvas on filter option change", async () => {
       await uploadFile();
       await screenshot("before");
       const canvasBefore = await getCanvas();

       await page.select("select", FILTER_OPTION.SEPIA);
       await screenshot("after");
       const canvasAfter = await getCanvas();

       expect(canvasBefore).not.toEqual(canvasAfter);
    });

    it("should update the download button on filter change", async () => {
        await uploadFile();

        await page.select("select", FILTER_OPTION.SEPIA);
        await screenshot("before");
        const hrefBefore = await page.$eval("a", a => a.href);

        await page.select("select", FILTER_OPTION.GRAYSCALE);
        await screenshot("after");
        const hrefAfter = await page.$eval("a", a => a.href);

        expect(hrefBefore).not.toEqual(hrefAfter);
    });
});