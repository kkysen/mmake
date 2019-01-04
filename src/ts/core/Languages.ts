export interface Languages {
    readonly c: string;
    readonly cpp: string;
}

export type Language = keyof Languages;