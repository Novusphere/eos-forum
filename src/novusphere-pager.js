class NovuspherePager {
    constructor(adapter, pageSize, query) {
        this.adapter = adapter;
        this._count = -1;
        this.currentPage = 0;
        this.pageSize = pageSize;
        this.query = query;
    }
    async getCount() {
        if (this._count == -1) {
            var count_query = {
                "count": this.adapter.config.database,
                "query": this.query.filter,
                "maxTimeMS": this.query.maxTimeMS
            };
            var n = (await this.adapter.api(count_query)).n;
            this._count = Math.ceil(n / this.pageSize);
        }
        return this._count;
    }
    async getNext() {
        return (await this.getAt(this.currentPage++));
    }
    async getAt(pageIndex) {
        this.query.skip = pageIndex * this.pageSize;
        this.query.limit = this.pageSize;
        return (await this.adapter.api(this.query));
    }
    async hasMore() {
        var count = await this.getCount();
        return (this.currentPage < count);
    }
}

export { NovuspherePager };