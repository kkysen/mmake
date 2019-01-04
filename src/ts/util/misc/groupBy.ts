import {Range} from "../collections/Range";

export const groupByOrdinal = function<T>(a: ReadonlyArray<T>, group: (t: T, i: number) => number, numGroups: number): T[][] {
    const groups: T[][] = Range.new(numGroups).map(() => []);
    for (let i = 0; i < a.length; i++) {
        const e = a[i];
        groups[group(e, i)].push(e);
    }
    return groups;
};

export const groupByNumber = function<T>(a: ReadonlyArray<T>, group: (t: T, i: number) => number): T[][] {
    const groups: T[][] = [];
    for (let i = 0; i < a.length; i++) {
        const e = a[i];
        const groupNum = group(e, i);
        const _group: T[] | undefined = groups[groupNum];
        if (_group) {
            _group.push(e);
        } else {
            groups[groupNum] = [e];
        }
    }
    return groups;
};

export const groupByString = function<T>(a: ReadonlyArray<T>, group: (t: T, i: number) => string): {[key: string]: T[]} {
    const groups: {[key: string]: T[]} = {};
    for (let i = 0; i < a.length; i++) {
        const e = a[i];
        const groupName = group(e, i);
        const _group: T[] | undefined = groups[groupName];
        if (_group) {
            _group.push(e);
        } else {
            groups[groupName] = [e];
        }
    }
    return groups;
};

export const groupBy = function<T, G>(a: ReadonlyArray<T>, group: (t: T, i: number) => G): Map<G, T[]> {
    const groups: Map<G, T[]> = new Map();
    for (let i = 0; i < a.length; i++) {
        const e = a[i];
        const groupName = group(e, i);
        const _group = groups.get(groupName);
        if (_group) {
            _group.push(e);
        } else {
            groups.set(groupName, [e]);
        }
    }
    return groups;
};