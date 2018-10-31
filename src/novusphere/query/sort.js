export default {
    score(asc) {
        return {
            score: asc ? 1 : -1
        };
    },
    time(asc) {
        return {
            createdAt: asc ? 1 : -1
        };
    }
}