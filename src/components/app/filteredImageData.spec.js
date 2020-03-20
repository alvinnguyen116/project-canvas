import {colorify, getFilteredImageData,
    optionToFunctionMap, sepiaFilterByPixel} from "./filterImageData.worker";
import {cloneDeep} from 'lodash';
import {FILTER_OPTION} from "./enums";

describe("function: getFilteredImageData", () => {
    let imageData;

    beforeEach(() => {
        imageData = {
            data: [0,1,0,0,1,0,0,0]
        };
    });

    it("should not filter if option is NONE", () => {
        const originalImageData = cloneDeep(imageData);
        const spy = jest.spyOn(optionToFunctionMap, 'get');
        getFilteredImageData(FILTER_OPTION.NONE, imageData);

        expect(imageData).toStrictEqual(originalImageData);
        expect(spy).not.toHaveBeenCalled();
    });

    it("should call the correct filter function", () => {
        const originalImageData = cloneDeep(imageData);
        const spy = jest.spyOn(optionToFunctionMap, 'get');
        getFilteredImageData(FILTER_OPTION.SEPIA, imageData);

        expect(originalImageData).not.toEqual(imageData);
        expect(spy).toBeCalledWith(FILTER_OPTION.SEPIA);
    });
});

describe("function: colorify", () => {
   it("should bound the value between [0,255]", () => {
      let num = colorify(-1);
      expect(num).toBe(0);
      num = colorify(256);
      expect(num).toBe(255);
   });

   it("should round decimals into integers", () => {
      let num = colorify(254.5);
      expect(num).toBe(255);
      num = colorify(1.9);
      expect(num).toBe(2);
      num = colorify(1.1);
      expect(num).toBe(1);
   });
});