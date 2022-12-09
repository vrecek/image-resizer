"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const easyimage_1 = require("easyimage");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const { ipcRenderer } = require("electron");
class App {
    fileName;
    fileType;
    previewSection;
    previewForm;
    resultSection;
    pathToImages;
    constructor() {
        this.fileName = null;
        this.fileType = null;
        this.resultSection = null;
        this.previewSection = null;
        this.previewForm = null;
        this.pathToImages = path_1.default.join(__dirname, 'images');
    }
    async saveImage(file) {
        this.removeFiles();
        return new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = async () => {
                const result = fr.result, base64 = result.replace(new RegExp(`^data:${file.type};base64,`), ''), name = file.name;
                await fs_1.default.promises.writeFile(`${this.pathToImages}/${name}`, base64, 'base64');
                this.fileName = name;
                this.fileType = file.type;
                resolve(result);
            };
            fr.readAsDataURL(file);
        });
    }
    async getImageInfo(resized) {
        const filename = resized
            ? `resized-${this.fileName}`
            : `${this.fileName}`;
        return await (0, easyimage_1.info)(`${this.pathToImages}/${filename}`);
    }
    async startResizing(x, y, asPx) {
        if (x === 0) {
            if (!this.previewForm)
                return null;
            const input = Array.from(this.previewForm.elements)[0];
            input.style.borderColor = 'crimson';
            setTimeout(() => input.style.borderColor = 'transparent', 1000);
            return null;
        }
        const options = {};
        const assignOption = (val) => {
            Object.assign(options, {
                height: val,
                ignoreAspectRatio: true
            });
        };
        if (!asPx) {
            const { width, height } = await this.getImageInfo();
            x = (width / 100) * x;
            if (y)
                assignOption((height / 100) * y);
        }
        else {
            if (y)
                assignOption(y);
        }
        await (0, easyimage_1.resize)({
            ...options,
            width: x,
            src: `${this.pathToImages}/${this.fileName}`,
            dst: `${this.pathToImages}/resized-${this.fileName}`
        });
        const src = await fs_1.default.promises.readFile(`${this.pathToImages}/resized-${this.fileName}`, 'base64');
        return {
            imageSource: `data:${this.fileType};base64,${src}`,
            base64: src
        };
    }
    async downloadFile(src) {
        const path = await ipcRenderer.invoke('dialog', 'showSaveDialog', {
            defaultPath: `resized-${this.fileName}`
        });
        if (path.canceled)
            return false;
        await fs_1.default.promises.writeFile(path.filePath, src, 'base64');
        return true;
    }
    removeFiles() {
        for (let x of fs_1.default.readdirSync(this.pathToImages))
            fs_1.default.unlinkSync(`${this.pathToImages}/${x}`);
        return this;
    }
    isImage(file) {
        return file.type === 'image/jpeg'
            || file.type === 'image/png';
    }
    popupBox() {
        const div = document.createElement('div');
        div.className = 'textbox-downloaded-popup';
        div.textContent = 'Downloaded';
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    }
    removePreview() {
        if (this.previewSection) {
            this.previewSection.remove();
            this.previewSection = null;
        }
        return this;
    }
    removeForm() {
        if (this.previewForm) {
            this.previewForm.remove();
            this.previewForm = null;
        }
        return this;
    }
    removeResult() {
        if (this.resultSection) {
            this.resultSection.remove();
            this.resultSection = null;
        }
        return this;
    }
    createPreview(src, width, height, type, name, size) {
        const elements = ['section', 'figure', 'section', 'p', 'p', 'p', 'p', 'p', 'span', 'span', 'span', 'span', 'span'];
        const [s1, f, s2, p1, p2, p3, p4, p5, sp1, sp2, sp3, sp4, sp5] = elements
            .map(x => document.createElement(x));
        const i = document.createElement('img');
        i.loading = 'lazy';
        i.src = src;
        f.appendChild(i);
        s2.className = 'details';
        p1.textContent = 'Width: ';
        sp1.textContent = `${width}px`;
        p1.appendChild(sp1);
        p2.textContent = 'Height: ';
        sp2.textContent = `${height}px`;
        p2.appendChild(sp2);
        p3.textContent = 'Type: ';
        sp3.textContent = type;
        p3.appendChild(sp3);
        p4.textContent = 'Size: ';
        sp4.textContent = `${(size / 1000).toFixed(1)}KB`;
        p4.appendChild(sp4);
        p5.textContent = 'Name: ';
        sp5.textContent = name;
        p5.appendChild(sp5);
        s2.appendChild(p1);
        s2.appendChild(p2);
        s2.appendChild(p3);
        s2.appendChild(p4);
        s2.appendChild(p5);
        s1.className = 'image-info';
        s1.appendChild(f);
        s1.appendChild(s2);
        this.previewSection = s1;
        return s1;
    }
    createForm(submitFunc) {
        const f = document.createElement('form'), i1 = document.createElement('input'), i2 = document.createElement('input'), div = document.createElement('div'), label = document.createElement('label'), checkbox = document.createElement('input'), b = document.createElement('button');
        i1.type = 'number';
        i1.placeholder = 'X value %/px';
        i2.type = 'number';
        i2.placeholder = 'Y value %/px';
        b.textContent = 'Resize';
        checkbox.type = 'checkbox';
        checkbox.id = 'chck';
        label.textContent = 'Values as pixels';
        label.htmlFor = 'chck';
        div.className = 'checkbox-div';
        div.appendChild(checkbox);
        div.appendChild(label);
        f.className = 'values';
        f.appendChild(i1);
        f.appendChild(i2);
        f.appendChild(div);
        f.appendChild(b);
        f.onsubmit = submitFunc;
        this.previewForm = f;
        return f;
    }
    createResult(src, width, height, size, downloadFunc) {
        const elements = ['section', 'figure', 'section', 'p', 'p', 'p', 'span', 'span', 'span', 'button'], [s1, f, s2, p1, p2, p3, sp1, sp2, sp3, btn] = elements.map(x => document.createElement(x)), img = document.createElement('img');
        s1.className = 'result';
        img.src = src;
        img.loading = 'lazy';
        f.appendChild(img);
        s2.className = 'details-resized';
        p1.textContent = 'Width: ';
        sp1.textContent = `${width} px`;
        p1.appendChild(sp1);
        p2.textContent = 'Height: ';
        sp2.textContent = `${height} px`;
        p2.appendChild(sp2);
        p3.textContent = 'Size: ';
        sp3.textContent = `${(size / 1000).toFixed(1)} KB`;
        p3.appendChild(sp3);
        s2.appendChild(p1);
        s2.appendChild(p2);
        s2.appendChild(p3);
        btn.className = 'download';
        btn.textContent = 'Download';
        btn.onclick = downloadFunc;
        s1.appendChild(f);
        s1.appendChild(s2);
        s1.appendChild(btn);
        this.resultSection = s1;
        return s1;
    }
    clearAll() {
        this.fileName = null;
        this.fileType = null;
        this.previewSection = null;
        this.previewForm = null;
        this.resultSection = null;
    }
}
exports.default = App;
