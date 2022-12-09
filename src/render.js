"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const App_1 = __importDefault(require("./App"));
const Client_1 = __importDefault(require("./Client"));
const program = new App_1.default(), load = new Client_1.default('load-bg'), leftSection = document.querySelector('.input-options'), rightSection = document.querySelector('.output'), selectInput = document.querySelector('.file-input');
load.defaultStyleDots({
    position: 'fixed'
});
selectInput.onchange = async (e) => {
    load.append(document.body);
    program.removePreview()
        .removeForm()
        .removeResult()
        .clearAll();
    if (!isParagraph())
        createEmptyParagraph();
    const t = e.target, file = t.files?.[0] ?? null;
    if (!file || !program.isImage(file)) {
        load.remove();
        return;
    }
    t.value = '';
    const src = await program.saveImage(file), info = await program.getImageInfo();
    const { width, height, type, name, size } = info, preview = program.createPreview(src, width, height, type, name, size), form = program.createForm(submitFunc);
    leftSection.appendChild(preview);
    leftSection.appendChild(form);
    load.remove();
};
const submitFunc = async (e) => {
    e.preventDefault();
    load.append(document.body);
    const form = e.target, [x, y, asPx] = Array.from(form.elements)
        .map(x => x.type === 'checkbox'
        ? x.checked
        : parseInt(x?.value || '0'));
    const sources = await program.startResizing(x, y, asPx);
    if (!sources) {
        load.remove();
        return;
    }
    const { width, height, size } = await program.getImageInfo(true), result = program.createResult(sources.imageSource, width, height, size, (e) => downloadFunc(e, sources.base64));
    program.removePreview()
        .removeForm();
    removeParagraph();
    rightSection.appendChild(result);
    load.remove();
};
const downloadFunc = async (e, resizedSource64) => {
    load.append(document.body);
    const saved = await program.downloadFile(resizedSource64);
    if (!saved) {
        load.remove();
        return;
    }
    program.removePreview()
        .removeForm()
        .removeResult()
        .removeFiles()
        .clearAll();
    createEmptyParagraph();
    load.remove();
    program.popupBox();
};
const createEmptyParagraph = () => {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'Select the image';
    rightSection.appendChild(p);
};
const removeParagraph = () => {
    const pEmpty = document.querySelector('p.empty');
    if (pEmpty)
        pEmpty.remove();
};
const isParagraph = () => !!document.querySelector('p.empty');
