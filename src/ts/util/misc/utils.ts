export const capitalize = function(word: string): string {
    return word.length === 0
        ? ""
        : word[0].toUpperCase() + word.slice(1);
};

export const tab = "    ";