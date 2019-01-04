export interface ElementTagNameMap extends HTMLElementTagNameMap, SVGElementTagNameMap {
    
}

export type ElementTag = keyof ElementTagNameMap;
export type ElementByTag<Tag extends ElementTag> = ElementTagNameMap[Tag];