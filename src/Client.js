"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Loading {
    className;
    div;
    currentAppended;
    constructor(className) {
        this.currentAppended = null;
        this.className = className ?? 'loading-default-class';
        this.div = document.createElement('div');
    }
    /**
        * @info Sets default loading styles
        * @param circleStyles Optional - Object of optional circle styles
    */
    defaultStyleCircle(circleStyles) {
        const appliedStyles = {
            backgroundClr: circleStyles?.backgroundClr ?? 'rgba(30, 30, 30, .9)',
            clr1: circleStyles?.clr1 ?? 'royalblue',
            clr2: circleStyles?.clr2 ?? 'cornflowerblue',
            position: circleStyles?.position ?? 'fixed',
            width: circleStyles?.width ?? '',
            height: circleStyles?.height ?? '',
            borderRadius: circleStyles?.borderRadius ?? '2.5em'
        };
        const { backgroundClr, clr1, clr2, position, width, height, borderRadius } = appliedStyles;
        const span1 = document.createElement('span'), span2 = document.createElement('span');
        const id = Math.random().toString(36).substring(2, 12);
        this.div.id = id;
        let pos, w, h, mw = '100px';
        if (position === 'fixed') {
            pos = 'fixed';
            w = width || 'clamp(120px, 30vw, 180px)';
        }
        else if (position === 'containerWidth') {
            pos = 'absolute';
            w = width || '50%';
        }
        else if (position === 'containerHeight') {
            pos = 'absolute';
            h = height || '80%';
            mw = 'auto';
        }
        if (!pos)
            throw new Error('Position not set');
        Object.assign(this.div.style, {
            position: pos,
            left: '0',
            top: '0',
            width: '100%',
            height: '100%',
            background: backgroundClr,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '9999'
        });
        Object.assign(span1.style, {
            background: clr1,
            borderRadius,
            position: 'relative',
            width: w ?? 'auto',
            height: h ?? 'auto',
            minWidth: mw,
            aspectRatio: 1
        });
        Object.assign(span2.style, {
            background: clr2,
            position: 'absolute',
            left: '50%',
            top: '50%',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            height: '80%'
        });
        span1.animate([
            { transform: 'rotate(0deg)' },
            { transform: 'rotate(360deg)' }
        ], {
            duration: 3000,
            iterations: Infinity
        });
        span1.appendChild(span2);
        this.div.appendChild(span1);
    }
    /**
        * @info Sets default loading styles
        * @param dotStyles Optional - Object of optional dot styles
    */
    defaultStyleDots(dotStyles) {
        const spans = [...Array(3)].map(x => document.createElement('span'));
        const cont = document.createElement('section');
        const appliedStyles = {
            backgroundClr: dotStyles?.backgroundClr ?? 'rgba(30, 30, 30, .9)',
            clr1: dotStyles?.clr1 ?? 'royalblue',
            position: dotStyles?.position ?? 'fixed',
            width: dotStyles?.width ?? '',
            height: dotStyles?.height ?? '',
        };
        const { backgroundClr, clr1, position } = appliedStyles;
        let { width, height } = appliedStyles;
        if (!width)
            width = position === 'fixed' ? '25px' : '15px';
        if (!height)
            height = position === 'fixed' ? '25px' : '15px';
        Object.assign(this.div.style, {
            position: position === 'fixed' ? 'fixed' : 'absolute',
            left: '0',
            top: '0',
            width: '100%',
            height: '100%',
            background: backgroundClr,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '9999'
        });
        Object.assign(cont.style, {
            display: 'flex'
        });
        let i = 200;
        for (let x of spans) {
            cont.appendChild(x);
            Object.assign(x.style, {
                background: clr1,
                width,
                height,
                borderRadius: '50%',
                marginRight: '.75em'
            });
            x.animate([
                { transform: 'scale(1)' },
                { transform: 'scale(.5)' },
                { transform: 'scale(1)' }
            ], { duration: 800, iterations: Infinity, delay: i });
            i += 200;
        }
        this.div.appendChild(cont);
    }
    /**
        * @param element Element which loading will be appended to
        * @param appendFirst Optional - if true, loading will be appended at the beginning of the container, otherwise as a last element (default)
    */
    append(element, appendFirst) {
        this.div.className = this.className;
        this.currentAppended = this.div;
        appendFirst
            ? element.prepend(this.div)
            : element.appendChild(this.div);
    }
    /**
        * Remove appended image
    */
    remove() {
        if (!this.currentAppended)
            return;
        this.currentAppended.remove();
        this.currentAppended = null;
    }
}
exports.default = Loading;
