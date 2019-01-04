import {HashSet} from "../collections/HashSet";
import {hashEquals} from "./hashEquals";

interface E<I, J, T> {
    i: I;
    j: J;
    value: T;
}

export const sparseTranspose = function <I, J, T>(a: E<I, J, T>[]): E<J, I, T>[] {
    return a.map(({i, j, value}) => ({i: j, j: i, value}));
};

interface Row<I, J, T> {
    i: I;
    row: {j: J, value: T}[];
}

const reconstructUsingHashNew = function<I, J, T, H>(flat: E<J, I, T>[], hashJ: (j: J) => H, newJ: (h: H) => J): Row<J, I, T>[] {
    return [...new Set<H>(flat.map(e => e.i).map(hashJ))]
        .sort()
        .map(h => ({
            i: newJ(h),
            row: flat.mapFilter(({i, j, value}) => hashJ(i) === h && ({j, value})),
        }));
};

const reconstructUsingHash = function<I, J, T, H>(flat: E<J, I, T>[], hashJ: (j: J) => H): Row<J, I, T>[] {
    const {hash, equals} = hashEquals.fromHash(hashJ);
    return [...HashSet.new({
        elements: flat.map(e => e.i),
        hashEquals: {hash, equals},
    })]
        .sortBy(hash)
        .map(_i => ({
            i: _i,
            row: flat.mapFilter(({i, j, value}) => equals(i, _i) && ({j, value})),
        }));
};

export const sparseTreeTranspose = function <I, J, T, H>(
    a: Row<I, J, T>[], hashJ: (j: J) => H, newJ?: (h: H) => J): Row<J, I, T>[] {
    const flatA = a.flatMap(({i, row}) => row.map(({j, value}) => ({i, j, value})));
    const flatB = sparseTranspose(flatA);
    if (newJ) {
        return reconstructUsingHashNew(flatB, hashJ, newJ);
    } else {
        return reconstructUsingHash(flatB, hashJ);
    }
};

export type SparseElement<I, J, T> = E<I, J, T>;
export type SparseRow<I, J, T> = Row<I, J, T>;