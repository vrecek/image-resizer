import {IInfoResult, info, resize} from 'easyimage'
import fs from 'fs'
import path from 'path'
const { ipcRenderer } = require("electron")


type SubmitFunction = (e: SubmitEvent) => void
type ClickFunction = (e: MouseEvent) => void
type Inputs = HTMLCollectionOf<HTMLInputElement>
export type ResizeSources = {
    base64: string
    imageSource: string
} | null
export type SaveDialog = {
    canceled: boolean
    filePath: string
}


export default class App {
    private fileName: string | null
    private fileType: string | null

    private previewSection: HTMLElement | null
    private previewForm: HTMLFormElement | null
    private resultSection: HTMLElement | null

    private pathToImages: string


    public constructor() {
        this.fileName = null  
        this.fileType = null

        this.resultSection = null
        this.previewSection = null
        this.previewForm = null

        this.pathToImages = path.join(__dirname, 'images')  
    }


    public async saveImage(file: File): Promise<string> {
        this.removeFiles()

        return new Promise<string>((resolve, reject) => {
            const fr: FileReader = new FileReader()

            fr.onload = async () => {
                const result: string = fr.result as string,
                      base64: string = result.replace(new RegExp(`^data:${file.type};base64,`), ''),
                      name: string = file.name


                await fs.promises.writeFile(`${this.pathToImages}/${name}`, base64, 'base64')
                this.fileName = name
                this.fileType = file.type

                resolve(result)
            }

            fr.readAsDataURL(file)
        })
    }


    public async getImageInfo(resized?: boolean): Promise<IInfoResult> {
        const filename: string = resized 
                                    ? `resized-${this.fileName}` 
                                    : `${this.fileName}`


        return await info(`${this.pathToImages}/${filename}`)
    }


    public async startResizing(x: number, y: number, asPx: boolean): Promise<ResizeSources> {
        if(x === 0) {
            if(!this.previewForm) return null

            const input = Array.from(this.previewForm.elements as Inputs)[0]

            input.style.borderColor = 'crimson'
            setTimeout(() => input.style.borderColor = 'transparent', 1000)

            return null
        }

        const options = {}

        const assignOption = (val: number): void => {
            Object.assign(options, {
                height: val,
                ignoreAspectRatio: true
            })
        }


        if(!asPx) {
            const {width, height} = await this.getImageInfo()
            
            x = (width / 100) * x
            if(y) assignOption((height / 100) * y)

        }else {
            if(y) assignOption(y)
        }


        await resize({
            ...options,
            width: x,
            src: `${this.pathToImages}/${this.fileName}`,
            dst: `${this.pathToImages}/resized-${this.fileName}`
        })

        const src: string = await fs.promises.readFile(`${this.pathToImages}/resized-${this.fileName}`, 'base64')

        return {
            imageSource: `data:${this.fileType};base64,${src}`,
            base64: src
        }
    }


    public async downloadFile(src: string): Promise<boolean> {
        const path: SaveDialog = await ipcRenderer.invoke('dialog', 'showSaveDialog', {
            defaultPath: `resized-${this.fileName}`
        })

        if(path.canceled)
            return false


        await fs.promises.writeFile(path.filePath, src, 'base64')

        return true
    }


    public removeFiles(): this {
        for(let x of fs.readdirSync(this.pathToImages)) 
            fs.unlinkSync(`${this.pathToImages}/${x}`)
        

        return this
    }


    public isImage(file: File): boolean {
        return file.type === 'image/jpeg' 
               || file.type === 'image/png'
    }


    public popupBox(): void {
        const div = document.createElement('div')

        div.className = 'textbox-downloaded-popup'
        div.textContent = 'Downloaded'
        
        document.body.appendChild(div)

        setTimeout(() => div.remove(), 3000)
    }


    public removePreview(): this {
        if(this.previewSection) {
            this.previewSection.remove()
            this.previewSection = null
        }
        
        return this
    }


    public removeForm(): this {
        if(this.previewForm) {
            this.previewForm.remove()
            this.previewForm = null
        }
            
        return this
    }


    public removeResult(): this {
        if(this.resultSection) {
            this.resultSection.remove()
            this.resultSection = null
        }

        return this
    }


    public createPreview(src: string, width: number, height: number, type: string, name: string, size: number): HTMLElement {
        const elements: string[] = ['section', 'figure', 'section', 'p', 'p', 'p', 'p', 'p', 'span', 'span', 'span', 'span', 'span']
        const [s1, f, s2, p1, p2, p3, p4, p5, sp1, sp2, sp3, sp4, sp5]: HTMLElement[] = elements
                                                                                        .map(x => document.createElement(x))


        const i: HTMLImageElement = document.createElement('img')


        i.loading = 'lazy'
        i.src = src
        f.appendChild(i)

        s2.className = 'details'

        p1.textContent = 'Width: '
        sp1.textContent = `${width}px`
        p1.appendChild(sp1)

        p2.textContent = 'Height: '
        sp2.textContent = `${height}px`
        p2.appendChild(sp2)

        p3.textContent = 'Type: '
        sp3.textContent = type
        p3.appendChild(sp3)

        p4.textContent = 'Size: '
        sp4.textContent = `${(size / 1000).toFixed(1)}KB`
        p4.appendChild(sp4)

        p5.textContent = 'Name: '
        sp5.textContent = name
        p5.appendChild(sp5)
        
        s2.appendChild(p1)
        s2.appendChild(p2)
        s2.appendChild(p3)
        s2.appendChild(p4)
        s2.appendChild(p5)


        s1.className = 'image-info'
        s1.appendChild(f)
        s1.appendChild(s2)

        this.previewSection = s1
        return s1
    }


    public createForm(submitFunc: SubmitFunction): HTMLFormElement {
        const f: HTMLFormElement = document.createElement('form'),
              i1: HTMLInputElement = document.createElement('input'),
              i2: HTMLInputElement = document.createElement('input'),
              div: HTMLElement = document.createElement('div'),
              label: HTMLLabelElement = document.createElement('label'),
              checkbox: HTMLInputElement = document.createElement('input'),
              b: Element = document.createElement('button')


        i1.type = 'number'
        i1.placeholder = 'X value %/px'
        
        i2.type = 'number'
        i2.placeholder = 'Y value %/px'

        b.textContent = 'Resize'

        checkbox.type = 'checkbox'
        checkbox.id = 'chck'
        label.textContent = 'Values as pixels'
        label.htmlFor = 'chck'
        div.className = 'checkbox-div'
        div.appendChild(checkbox)
        div.appendChild(label)

        f.className = 'values'
        f.appendChild(i1)
        f.appendChild(i2)
        f.appendChild(div)
        f.appendChild(b)
        f.onsubmit = submitFunc

        this.previewForm = f
        return f
    }


    public createResult(src: string, width: number, height: number, size: number, downloadFunc: ClickFunction): HTMLElement {
        const elements: string[] = ['section', 'figure', 'section', 'p', 'p', 'p', 'span', 'span', 'span', 'button'],
              [s1, f, s2, p1, p2, p3, sp1, sp2, sp3, btn] = elements.map(x => document.createElement(x)),
              img: HTMLImageElement = document.createElement('img')


        s1.className = 'result'

        img.src = src
        img.loading = 'lazy'

        f.appendChild(img)

        s2.className = 'details-resized'

        p1.textContent = 'Width: '
        sp1.textContent = `${width} px`
        p1.appendChild(sp1)

        p2.textContent = 'Height: '
        sp2.textContent = `${height} px`
        p2.appendChild(sp2)

        p3.textContent = 'Size: '
        sp3.textContent = `${(size / 1000).toFixed(1)} KB`
        p3.appendChild(sp3)

        s2.appendChild(p1)
        s2.appendChild(p2)
        s2.appendChild(p3)

        btn.className = 'download'
        btn.textContent = 'Download'
        btn.onclick = downloadFunc
        
        s1.appendChild(f)
        s1.appendChild(s2)
        s1.appendChild(btn)

        this.resultSection = s1
        return s1
    }

    
    public clearAll(): void {
        this.fileName = null
        this.fileType = null

        this.previewSection = null
        this.previewForm = null
        this.resultSection = null
    }
}