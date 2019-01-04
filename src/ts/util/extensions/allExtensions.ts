import {cmp} from "../misc/compare";
import {equals as equalsLib} from "../misc/equals";
import {mapFields} from "../object/mapFields";
import {truthy} from "../types/Truthy";
import {ValueOf} from "../types/ValueOf";
import {isBrowser} from "../window/anyWindow";
import {writableExtensions} from "./extensionsConfig";
import Equals = equalsLib.Equals;

const immutableDescriptor: PropertyDescriptor = Object.freeze({
    writable: writableExtensions,
    enumerable: false,
    configurable: true,
});

const defineSharedProperties = function(obj: any, sharedDescriptor: PropertyDescriptor, propertyValues: Object,
                                        overwrite: boolean = true): void {
    const properties: PropertyDescriptorMap & ThisType<any> = Object.getOwnPropertyDescriptors(propertyValues);
    Object.entries(properties).forEach(([propertyName, property]) => {
        if (!overwrite && obj[propertyName]) {
            return;
        }
        property = {...property, ...sharedDescriptor};
        if (property.get || property.set) {
            delete property.writable;
        }
        properties[propertyName] = property;
    });
    Object.defineProperties(obj, properties);
};

defineSharedProperties(Object, immutableDescriptor, {
    
    defineSharedProperties,
    
    defineImmutableProperties(obj: any, propertyValues: Object, overwrite: boolean = true): void {
        defineSharedProperties(obj, immutableDescriptor, propertyValues, overwrite);
    },
    
});

Object.defineImmutableProperties(Object, {
    
    allKeys<T>(t: T): (keyof T)[] {
        return [...Object.getOwnPropertyNames(t), ...Object.getOwnPropertySymbols(t)];
    },
    
    allValues<T>(t: T): ValueOf<T>[] {
        return Object.allKeys(t).map(key => t[key]);
    },
    
    allEntries<T>(t: T): [keyof T, ValueOf<T>][] {
        return Object.allKeys(t).map(key => [key, t[key]] as [keyof T, ValueOf<T>]);
    },
    
    definePolyfillProperties(obj: any, propertyValues: Object): void {
        Object.defineImmutableProperties(obj, propertyValues, false);
    },
    
    getPrototypeChain(object: any): Object[] {
        const chain: Object[] = [];
        for (let o = object; o !== null; o = Object.getPrototypeOf(o)) {
            chain.push(o);
        }
        return chain;
    },
    
    getAllPropertyNames(object: any): string[] {
        return Array.from(
            new Set<string>(
                Object.getPrototypeChain(object)
                    .flatMap(Object.getOwnPropertyNames as (o: Object) => string[])
            )
        );
    },
    
    assignProperties(target: object, ...sources: any[]): any {
        for (const source of sources) {
            Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
        }
    },
    
    getting<T, K extends keyof T>(key: K): (o: T) => T[K] {
        return o => o[key];
    },
    
    deleting<T, K extends keyof T>(key: K): (o: T) => T {
        return o => {
            delete o[key];
            return o;
        };
    },
    
});

Object.defineImmutableProperties(Object.prototype, {
    
    _hasProperty(this: object, property: PropertyKey): boolean {
        for (let o = this; o !== null; o = Object.getPrototypeOf(o)) {
            if (o.hasOwnProperty(property)) {
                return true;
            }
        }
        return false;
    },
    
    freeze<T>(this: T): T {
        return Object.freeze(this);
    },
    
    seal<T>(this: T): T {
        return Object.seal(this);
    },
    
    shallowClone<T>(this: T): T {
        return Object.assign(Object.create(null), this);
    },
    
    fullClone<T>(this: T): T {
        return Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
    },
    
    mapFields<T, U>(this: {[field: string]: T}, mapper: (field: T) => U): {[field: string]: U} {
        return mapFields(this, mapper);
    },
    
    freezeFields<T>(this: T): T {
        for (const value of Object.values(this)) {
            value.freeze();
        }
        return this;
    }
    
});

Object.defineImmutableProperties(Function, {
    
    compose(...funcs: Function[]): Function {
        const numFuncs: number = funcs.length;
        if (numFuncs === 0) {
            return () => undefined;
        }
        const [firstFunc, ...restFunc] = funcs;
        if (numFuncs === 1) {
            return firstFunc();
        }
        return function(...args: any[]) {
            let result = firstFunc();
            for (const func of funcs) {
                result = func(result);
            }
            return result;
        };
    },
    
});

Object.defineImmutableProperties(Function.prototype, {
    
    then_<T, U, V>(this: (arg: T) => U, nextFunc: (arg: U) => V): (arg: T) => V {
        return (arg: T) => nextFunc(this(arg));
    },
    
    applyReturning<T>(this: (arg: T) => void): (arg: T) => T {
        return (arg: T) => {
            this(arg);
            return arg;
        };
    },
    
    mapping<T, U>(this: (arg: T) => U): (array: T[]) => U[] {
        return array => array.map(this);
    },
    
    applying<T, U>(this: (...args: T[]) => U): (array: T[]) => U {
        return array => this(...array);
    },
    
    timed<T extends Function>(this: T): T {
        const timer = (...args: any[]) => {
            const {name} = this;
            console.time(name);
            const returnValue = this(...args);
            console.timeEnd(name);
            return returnValue;
        };
        return <T> <any> timer.named("timing_" + this.name);
    },
    
    setName<T extends Function>(this: T, name: string): void {
        Object.defineProperties(this, {
            name: {
                value: name,
            },
        });
    },
    
    named<T extends Function>(this: T, name: string): T {
        this.setName(name);
        return this;
    },
    
    negate<T extends (...args: any[]) => boolean>(this: T): T {
        return <T> ((...args: any[]) => !this(...args));
    },
    
});

Object.defineImmutableProperties(Array.prototype, {
    
    size<T>(this: T[]) {
        return this.length;
    },
    
    last<T>(this: T[]): T {
        return this[this.length - 1];
    },
    
    clear<T>(this: T[]): void {
        this.length = 0;
    },
    
    removeAt<T>(this: T[], index: number): T {
        return this.splice(index, 1)[0];
    },
    
    remove<T>(this: T[], value: T, equals?: Equals<T>): T | undefined {
        const i: number = !equals ? this.indexOf(value) : this.findIndex(equalsLib.bind(equals, value));
        if (i !== -1) {
            return this.removeAt(i);
        }
    },
    
    add<T>(this: T[], index: number, value: T): void {
        this.splice(index, 0, value);
    },
    
    addAll<T>(this: T[], values: T[], index: number = this.length): void {
        if (index === this.length) {
            this.push(...values);
        } else {
            this.splice(index, 0, ...values);
        }
    },
    
    applyOn<T, U>(this: T[], func: (args: T[]) => U): U {
        return func(this);
    },
    
    callOn<T, U>(this: T[], func: (...args: T[]) => U): U {
        return func(...this);
    },
    
    toObject<T>(this: [string, T][], noPrototype: boolean = false): {[key: string]: T} {
        let o: {[key: string]: T} = noPrototype ? Object.create(null) : {};
        for (const [k, v] of this) {
            o[k] = v;
        }
        return o;
    },
    
    sortBy<T, U extends number>(this: T[], key: (t: T) => U): T[] {
        return this.sort(cmp.byNumber(key));
    },
    
    random<T>(this: T[]): T {
        return this[Math.floor(Math.random() * this.length)];
    },
    
    mapCall<U, T extends () => U>(this: T[]): U[] {
        return this.map(f => f());
    },
    
    callEach<T extends (u: U) => void, U = undefined>(this: T[], u: U): void {
        this.forEach(f => f(u));
    },
    
    async asyncForEach<T>(this: T[], func: (value: T, index: number, array: T[]) => Promise<void>): Promise<void> {
        await Promise.all(this.map(func));
    },
    
    mapFilter<T, U>(this: T[], map: (value: T, index: number, array: T[]) => OrFalsy<U>): U[] {
        return this.map(map).filter(truthy);
    },
    
    asyncMap<T, U>(this: T[], map: (value: T, index: number, array: T[]) => Promise<U>): Promise<U[]> {
        return Promise.all(this.map(map));
    },
    
    async asyncFilter<T>(this: T[],
                         filter: (value: T, index: number, array: T[]) => Promise<boolean>
    ): Promise<T[]> {
        return (await Promise.all(
                this.map(async (value, index, array) => ({value, filtered: await filter(value, index, array)})))
        ).filter(e => e.filtered).map(e => e.value);
    },
    
    async asyncMapFilter<T, U>(this: T[],
                               map: (value: T, index: number, array: T[]) => Promise<OrFalsy<U>>): Promise<U[]> {
        return (await Promise.all(this.map(map))).filter(truthy);
    },
    
    readOnly() {
        return this;
    },
    
    _() {
        return this;
    },
    
});

Object.definePolyfillProperties(Array.prototype, {
    
    flatMap<T, U, This = undefined>(
        this: T[],
        flatMap: (this: This, value: T, index: number, array: T[]) => U | U[],
        thisArg?: This): U[] {
        if (thisArg) {
            flatMap = flatMap.bind(thisArg);
        }
        return ([] as U[]).concat(...this.map(flatMap));
    },
    
    flat<T>(this: T[], depth: number = -1): any[] {
        // TODO faster flatten polyfill
        return depth === 0
            ? this
            : this.reduce(
                (a, e: any | any[]) => a.concat(Array.isArray(e) ? e.flat(depth - 1) : e),
                [],
            );
    },
    
});

const nativeSlice = String.prototype.slice;

Object.defineImmutableProperties(String.prototype, {
    
    equals(this: string, s: string): boolean {
        return this === s;
    },
    
    boundEquals(this: string): (s: string) => boolean {
        return s => this === s;
    },
    
    // allow negative indices for end
    slice(this: string, start: number = 0, end: number = this.length) {
        if (end < 0) {
            end = this.length + end;
        }
        return nativeSlice.call(this, start, end);
    },
    
});

Object.defineImmutableProperties(Number, {
    
    isNumber(n: number): boolean {
        return !Number.isNaN(n);
    },
    
    toPixels(n: number): string {
        return Math.round(n) + "px";
    },
    
});

Object.defineImmutableProperties(Map.prototype, {
    
    map<K, V, T>(this: Map<K, V>, map: (v: V, k: K) => T): Map<K, T> {
        return new Map([...this].map(([k, v]) => [k, map(v, k)] as [K, T]));
    },
    
});

Object.defineImmutableProperties(Set.prototype, {
    
    map<T, U>(this: Set<T>, map: (e: T) => U): Set<U> {
        return new Set([...this].map(map));
    },
    
});

// don't touch RegExp.prototype,
// since modifying it will bail out of RegExp's fast paths.

if (isBrowser) {
    
    Object.defineImmutableProperties(Node.prototype, {
        
        appendBefore(this: Node, node: Node): Node {
            const {parentNode} = this;
            parentNode && parentNode.insertBefore(node, this);
            return node;
        },
        
        appendAfter(this: Node, node: Node): Node {
            const {nextSibling} = this;
            nextSibling && nextSibling.appendBefore(node);
            return node;
        },
        
    });
    
    Object.defineImmutableProperties(Element.prototype, {
        
        clearHTML(this: Element) {
            this.innerHTML = "";
        },
        
        setAttributes(this: Element, attributes: {[name: string]: any}) {
            for (const [attribute, value] of Object.entries(attributes)) {
                if (value) {
                    this.setAttribute(attribute, value.toString());
                }
            }
        },
        
    });
    
    Object.defineImmutableProperties(HTMLElement.prototype, {
        
        appendTo<T extends HTMLElement>(this: T, parent: HTMLElement): T {
            parent.appendChild(this);
            return this;
        },
        
        appendNewElement(this: HTMLElement, tagName: string): HTMLElement {
            return this.appendChild(document.createElement(tagName));
        },
        
        appendDiv(this: HTMLElement): HTMLDivElement {
            return this.appendNewElement("div");
        },
        
        appendButton(this: HTMLElement, buttonText: string): HTMLButtonElement {
            const button = this.appendNewElement("button");
            button.innerText = buttonText;
            return button;
        },
        
        appendBr(this: HTMLElement): HTMLBRElement {
            return this.appendNewElement("br");
        },
        
        withInnerText<T extends HTMLElement>(this: T, text: string): T {
            this.innerText = text;
            return this;
        },
        
        withInnerHTML<T extends HTMLElement>(this: T, html: string): T {
            this.innerHTML = html;
            return this;
        },
        
    });
    
    Object.defineImmutableProperties(HTMLIFrameElement.prototype, {
        
        activate(this: HTMLIFrameElement): ActiveHTMLIFrameElement {
            this.appendTo(document.body);
            return this as ActiveHTMLIFrameElement;
        },
        
    });
    
}

export const addExtensions = function(): void {

};