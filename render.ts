import { IInfoResult } from "easyimage"
import App, { ResizeSources } from "./App"
import Loading from "./Client"


const program: App = new App(),
      load: Loading = new Loading('load-bg'),
      leftSection: HTMLElement = document.querySelector('.input-options')!,
      rightSection: HTMLElement = document.querySelector('.output')!,
      selectInput: HTMLInputElement = document.querySelector('.file-input')!


load.defaultStyleDots({
    position: 'fixed'
})



selectInput.onchange = async (e: Event) => {
    load.append(document.body)

    program.removePreview()
           .removeForm()
           .removeResult()
           .clearAll()


    if(!isParagraph())
        createEmptyParagraph()


    const t: HTMLInputElement = e.target as HTMLInputElement,
          file: File | null = t.files?.[0] ?? null
    

    if(!file || !program.isImage(file)) {
        load.remove()

        return
    }

    t.value = ''

    const src = await program.saveImage(file),
          info: IInfoResult = await program.getImageInfo()



    const {width, height, type, name, size} = info,
           preview: HTMLElement = program.createPreview(src, width, height, type, name, size),
           form: HTMLFormElement = program.createForm(submitFunc)



    leftSection.appendChild(preview)
    leftSection.appendChild(form)

    load.remove()
}


const submitFunc = async (e: SubmitEvent): Promise<void> => {
    e.preventDefault()

    load.append(document.body)


    const form: HTMLFormElement = e.target as HTMLFormElement,
          [x, y, asPx] = Array.from(form.elements as HTMLCollectionOf<HTMLInputElement>)
                        .map(x => x.type === 'checkbox' 
                                            ? x.checked 
                                            : parseInt(x?.value || '0')
                        ) as [number, number, boolean]


    const sources: ResizeSources = await program.startResizing(x, y, asPx)

    if(!sources) {
        load.remove()

        return
    }

    const {width, height, size} = await program.getImageInfo(true),
          result = program.createResult(sources.imageSource, width, height, size, (e) => downloadFunc(e, sources.base64))


    program.removePreview()
           .removeForm()


    removeParagraph()

    rightSection.appendChild(result)


    load.remove()
}


const downloadFunc = async (e: MouseEvent, resizedSource64: string): Promise<void> => {
    load.append(document.body)

    const saved: boolean = await program.downloadFile(resizedSource64)

    if(!saved) {
        load.remove()

        return
    }


    program.removePreview()
           .removeForm()
           .removeResult()
           .removeFiles()
           .clearAll()


    createEmptyParagraph()

    load.remove()

    program.popupBox()
}

const createEmptyParagraph = (): void => {
    const p: HTMLElement = document.createElement('p')
    p.className = 'empty'
    p.textContent = 'Select the image'

    rightSection.appendChild(p)
}

const removeParagraph = (): void => {
    const pEmpty = document.querySelector('p.empty')
    if(pEmpty) pEmpty.remove()
}

const isParagraph = (): boolean => !!document.querySelector('p.empty')