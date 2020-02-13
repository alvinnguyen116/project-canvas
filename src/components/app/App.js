import React, {useEffect, useRef, useState} from 'react';
import { IconNames } from "@blueprintjs/icons";
import { Button, Intent, HTMLSelect } from "@blueprintjs/core";
import './App.scss';
import "@blueprintjs/core/lib/css/blueprint.css";
import FilterImageDataWorker from "./filterImageData.worker";
import {FILTER_OPTION, FORM_OPTION} from "./enums";

function App() {
    const INITIAL_FILENAME_STATE = "Choose file...";
    // web worker is not natively supported in CRA (create-react-app)
    // work-around: https://medium.com/p/3718d2a1166b/responses/show
    const worker = new FilterImageDataWorker();

    // references to element on page
    const inputRef = useRef(null);
    const canvasRef = useRef(null);
    const selectRef = useRef(null);

    // component state
    const [fileName, setFileName] = useState(INITIAL_FILENAME_STATE);
    const [imageData, setImageData] = useState(null);
    const [currentFilterOption, setCurrentFilterOption] = useState(FILTER_OPTION.NONE);
    const [downloadLink, setDownloadLink] = useState(null);

    /**
     * @desc Whenever the current filter changes,
     * AND imageData exists, execute the following:
     *  - filter the image data by the current filter
     *    in a separate thread
     *  - clear the canvas
     *  - draw the new filtered image onto canvas
     *  - update the download link to reflect the new canvas
     */
    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (imageData === null) return; // ignore if image has been cleared or not set
        worker.postMessage({currentFilterOption, imageData});
        worker.addEventListener("message", e => {
            clearCanvas();
            // draw new filtered image starting from top left corner
            context.putImageData(e.data, 0, 0);
            setDownloadLink(canvas.toDataURL());
        });
    }, [currentFilterOption]);

    /**
     * @desc Draws a blank rect onto the canvas
     * to erase the current image.
     */
    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const {width, height} = canvas;
        const context = canvas.getContext("2d");
        context.clearRect(0,0, width, height);
    };

    /**
     * @param e - event triggered from onchange
     * @desc Execute code based on the formOption
     * which triggered the event.
     */
    const handleOnChange = e => {
        const {formOption} = e.target.dataset;
        switch (formOption) {
            case FORM_OPTION.INPUT:
                const {files} = inputRef.current;
                if (files && files[0]) {
                    readFileAsDataUrl(files[0], drawImageOnCanvas);
                }
                break;
            case FORM_OPTION.SELECT:
                const {value: filterOption} = e.target;
                console.log(filterOption);
                setCurrentFilterOption(filterOption);
                console.log(selectRef.current);
                break;
            default:
                break;
        }
    };

    /**
     * @param file - file to read
     * @param callback - callback to call after file read
     * @desc Read file as data URL and calls callback with result.
     * Updates the current filename.
     */
    function readFileAsDataUrl(file, callback) {
        const fileReader = new FileReader();
        fileReader.addEventListener("load", () => {
            callback(fileReader.result)
        });
        setFileName(file.name);
        fileReader.readAsDataURL(file);
    }

    /**
     * @param src - new image src
     * @desc Given an image src, draw a new image on canvas.
     */
    function drawImageOnCanvas(src) {
        const img = new Image();
        img.setAttribute("src", src);
        setDownloadLink(src);
        img.addEventListener("load", () => {
            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");
            const {height, width} = img;
            // adjust canvas's dimensions to image's
            canvas.height = height;
            canvas.width = width;
            // draw final img in top left corner of canvas
            context.drawImage(img, 0, 0, width, height);
            // update the current filter option accordingly
            selectRef.current.value = FILTER_OPTION.NONE;
            // store imageData for filtering logic
            setImageData(context.getImageData(0,0, width, height));
        });
    }

    /**
     * @desc Only render the download button
     * if the downloadLink is truthy.
     */
    const renderDownloadButton = () => {
        if (downloadLink) {
            return (
                <a href={downloadLink} download>
                    <Button
                        className="download-btn"
                        rightIcon={IconNames.DOWNLOAD}
                        intent={Intent.PRIMARY}
                        text={"Download"}/>
                </a>
            );
        }
    };

    return (
        <div className="app">
            <main>
                <div className="options">
                    <label className="bp3-file-input">
                        <input
                            type={"file"}
                            accept="image/png, image/jpeg"
                            data-form-option={FORM_OPTION.INPUT}
                            ref={inputRef}
                            onChange={handleOnChange}/>
                        <span className="bp3-file-upload-input">{fileName}</span>
                    </label>
                    <HTMLSelect
                        iconProps={{icon: IconNames.FILTER_LIST}}
                        data-form-option={FORM_OPTION.SELECT}
                        value={currentFilterOption}
                        onChange={handleOnChange}
                        elementRef={selectRef}>
                        {
                            Object.entries(FILTER_OPTION)
                                .map(([key,value]) =>
                                    <option key={value} value={value}>{value}</option>
                                )
                        }
                    </HTMLSelect>
                    {renderDownloadButton()}
                </div>
                <canvas ref={canvasRef}/>
            </main>
        </div>
    );
}

export default App;
