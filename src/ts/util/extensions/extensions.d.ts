declare type OrFalsy<T> = T | false | 0 | null | undefined | "";

declare type Truthy<T> = T extends false | 0 | null | undefined | "" ? never : T;

declare type StringKeyOf<T> = Extract<keyof T, string>;
declare type SymbolKeyOf<T> = Extract<keyof T, symbol>;
declare type ValueOf<T> = T[keyof T];

declare interface ObjectConstructor {
    
    keys<T>(t: T): StringKeyOf<T>[];
    
    values<T>(t: T): T[StringKeyOf<T>][];
    
    entries<T>(t: T): [StringKeyOf<T>, T[StringKeyOf<T>]][];
    
    getOwnPropertyNames<T>(t: T): StringKeyOf<T>[];
    
    getOwnPropertySymbols<T>(t: T): SymbolKeyOf<T>[];
    
    allKeys<T>(t: T): (keyof T)[];
    
    allValues<T>(t: T): ValueOf<T>[];
    
    allEntries<T>(t: T): [keyof T, ValueOf<T>][];
    
    defineSharedProperties(object: any, sharedDescriptor: PropertyDescriptor, propertyValues: Object, overwrite?: boolean): void;
    
    defineImmutableProperties(object: any, propertyValues: Object, overwrite?: boolean): void;
    
    definePolyfillProperties(object: any, propertyValues: Object): void;
    
    getPrototypeChain(object: any): Object[];
    
    getAllPropertyNames(object: any): string[];
    
    bind<T>(t: T): T;
    
    assignProperties<T, U>(target: T, source: U): T & U;
    
    assignProperties<T, U, V>(target: T, source1: U, source2: V): T & U & V;
    
    assignProperties<T, U, V, W>(target: T, source1: U, source2: V, source3: W): T & U & V & W;
    
    assignProperties(target: object, ...sources: any[]): any;
    
    getting<T, K extends keyof T>(key: K): (o: T) => T[K];
    
    deleting<T, K extends keyof T>(key: K): (o: T) => T;
    
}

declare interface Object {
    
    _hasProperty(v: PropertyKey): boolean;
    
    freeze<T>(this: T): T;
    
    seal<T>(this: T): T;
    
    // _ is b/c there are other objects with slightly different clone methods
    shallowClone<T>(this: T): T;
    
    // copies complete property descriptors
    fullClone<T>(this: T): T;
    
    mapFields<T, U>(this: T, mapper: (field: ValueOf<T>) => ValueOf<U>): U;
    
    mapFields<T, U>(this: {[field: string]: T}, mapper: (field: T) => U): {[field: string]: U};
    
    freezeFields<T>(this: T): T;
    
}

declare interface FunctionConstructor {
    
    compose(...funcs: Function[]): Function;
    
}

declare interface Function {
    
    bind<T extends Function>(this: T, thisArg: any): T;
    
    then_<T, U, V>(this: (arg: T) => U, nextFunc: (arg: U) => V): (arg: T) => V;
    
    then_(this: () => void, nextFunc: () => void): () => void;
    
    applyReturning<T>(this: (arg: T) => void): (arg: T) => T;
    
    mapping<T, U>(this: (arg: T) => U): (array: T[]) => U[];
    
    applying<T, U>(this: (...args: T[]) => U): (array: T[]) => U;
    
    timed<T>(this: T): T;
    
    setName(name: string): void;
    
    named<T>(this: T, name: string): T;
    
    negate<T extends (...args: any[]) => boolean>(this: T): T;
    
}

declare interface Array<T> extends IterableIterator<T> {
    
    size(): number;
    
    last(): T;
    
    clear(): void;
    
    removeAt(index: number): T;
    
    removeIf(value: T, equals?: (e1: T, e2: T) => boolean): T | undefined;
    
    add(index: number, value: T): void;
    
    addAll(values: ReadonlyArray<T>, index?: number): void;
    
    applyOn<U>(func: (args: T[]) => U): U;
    
    callOn<U>(func: (...args: T[]) => U): U;
    
    toObject<T, K extends keyof T>(this: [K, T[K]][], noPrototype?: boolean): T;
    
    toObject<T>(this: [string, T][], noPrototype?: boolean): {[property: string]: T};
    
    toObject(this: [string, any][], noPrototype?: boolean): any;
    
    sortBy<U>(key: (t: T) => U): T[];
    
    random(): T;
    
    mapCall<U, T extends () => U>(this: T[]): U[];
    
    callEach<T extends (u: U) => void, U = undefined>(this: T[], u: U): void;
    
    asyncForEach(func: (value: T, index: number, array: T[]) => Promise<void>): Promise<void>;
    
    mapFilter<U>(map: (value: T, index: number, array: T[]) => OrFalsy<U>): U[];
    
    asyncMap<U>(map: (value: T, index: number, array: T[]) => Promise<U>): Promise<U[]>;
    
    asyncFilter(filter: (value: T, index: number, array: T[]) => Promise<boolean>): Promise<T[]>;
    
    asyncMapFilter<U>(map: (value: T, index: number, array: T[]) => Promise<OrFalsy<U>>): Promise<U[]>;
    
    find(predicate: (value: T, index: number, array: T[]) => true, thisArg?: any): T;
    
    readOnly(): ReadonlyArray<T>;
    
    _<T>(): T[];
    
}

declare interface ReadonlyArray<T> {
    
    readOnly(): ReadonlyArray<T>;
    
    _<T>(): T[];
    
}

declare interface String {
    
    equals(s: string): boolean;
    
    boundEquals(): (s: string) => boolean;
    
}

declare interface NumberConstructor {
    
    isNumber(n: number): boolean;
    
    toPixels(n: number): string;
    
}

declare interface Map<K, V> {
    
    map<T>(map: (v: V, k: V) => T): Map<K, T>;
    
}

declare interface Set<T> {
    
    map<U>(map: (e: T) => U): Set<U>;
    
}

declare interface Node {
    
    appendBefore(node: Node): Node;
    
    appendAfter(node: Node): Node;
    
}

declare interface Element {
    
    clearHTML(): void;
    
    setAttributes(attributes: {[name: string]: any}): void;
    
}

declare interface HTMLElement {
    
    appendTo<T extends HTMLElement>(this: T, parent: HTMLElement): T;
    
    appendNewElement<K extends keyof HTMLElementTagNameMap>(tagName: K): HTMLElementTagNameMap[K];
    
    appendNewElement(tagName: string): HTMLElement;
    
    appendDiv(): HTMLDivElement;
    
    appendButton(buttonText: string): HTMLButtonElement;
    
    appendBr(): HTMLBRElement;
    
    withInnerText<T extends HTMLElement>(this: T, text: string): T;
    
    withInnerHTML<T extends HTMLElement>(this: T, html: string): T;
    
}

declare interface HTMLAppendable<T> {
    
    appendTo(parent: HTMLElement): T;
    
}

declare interface HTMLElement extends HTMLAppendable<HTMLElement> {

}

declare interface HTMLIFrameElement {
    
    activate(): ActiveHTMLIFrameElement;
    
}

declare interface ActiveHTMLIFrameElement extends HTMLIFrameElement {
    
    readonly contentDocument: Document;
    
    readonly contentWindow: Window;
    
}

declare interface Window {
    
    postMessage(message: any, targetOrigin: string, transfer?: Transferable[]): void;
    
}