function closestMatch(word, words) {
    let smallest = Number.MAX_SAFE_INTEGER;
    let closest = '';
    for (w of words) {
        const dist = minDistance(word, w);
        if (dist < smallest) {
            smallest = dist;
            closest = w;
        }
    }
    return closest;
}

function minDistance(word1, word2) {
    return minDistanceHelper(word1, word2, word1.length, word2.length, 0, 0, {});
}

function minDistanceHelper(w1, w2, m, n, i, j, memo) {
    if (w1 === w2) {
        return 0;
    }

    const key = w1;
    if (key in memo) {
        return memo[key];
    }

    let del = Number.MAX_SAFE_INTEGER;
    let ins = Number.MAX_SAFE_INTEGER;
    let rep = Number.MAX_SAFE_INTEGER;

    // delete ith character if first word is the same size or bigger than
    // the second word
    if (m >= n) {
        del = minDistanceHelper(w1.substring(0,i) + w1.substring(i + 1), w2, m - 1, n, i, j, memo) + 1;
    }

    // check if we can replace the ith char
    if (i < m && j < n) {
        if (w1[i] != w2[j]) {
            rep = minDistanceHelper(w1.substring(0,i) + w2[j] + w1.substring(i + 1), w2, m, n, i + 1, j + 1, memo) + 1;
        }
        else {
            rep = minDistanceHelper(w1, w2, m, n, i + 1, j + 1, memo);
        }
    }

    // if the first word is smaller than the second
    // then insart the jth character of the second word
    if (m <= n || (i < m && j < n && w1[i] != w2[j])) {
        ins = minDistanceHelper(w1.substring(0,i) + w2[j] + w1.substring(i), w2, m + 1, n, i + 1, j + 1, memo) + 1
    }

    smallest = Math.min(del, ins, rep);
    memo[key] = smallest;
    return smallest;
}

function getStudent(name, studentsInDB) {
    for (period of studentsInDB) {
        for (student of period) {
            if (name === student.name) {
                return student;
            }
        }
    }
    return null;
}

module.exports.closestMatch = closestMatch;
module.exports.getStudent = getStudent;