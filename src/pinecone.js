const pinecone = require("@pinecone-database/pinecone");

module.exports.PineConeInstance = class PineConeInstance {
    //

    /**
     * @param {{
     * indexName: string;
     * environment: string;
     * apiKey: string;
     * }} options
     *
     * @property {string} environment
     * @property {string} apiKey
     */

    constructor(options) {
        this.environment = options.environment;
        this.apiKey = options.apiKey;
        this.client = new pinecone.PineconeClient();
        this.index = null;
        this.indexName = options.indexName;
    }

    //

    /**
     * @description Initiates the PineCone client
     * @returns {Promise<void>}
     */

    async init() {
        await this.client.init({
            environment: this.environment,
            apiKey: this.apiKey,
        });
        this.index = this.client.Index(this.indexName);
    }

    //

    /**
     * @param {Vector[]} vectors
     * @param {string} namespace
     */

    async upsert(vectors, namespace) {
        const upsertResponse = await this.index
            ?.upsert({
                upsertRequest: {
                    vectors: vectors,
                    namespace,
                },
            })
            .catch((e) => e);

        console.log(upsertResponse);

        if (!upsertResponse) throw new Error("Initiate the Client before upserting a doc");
    }

    //

    /**
     * @param {Vector} vector
     * @param {string} namespace
     */

    async update(vector, namespace) {
        const updateResponse = await this.index
            ?.update({
                updateRequest: {
                    id: vector.id,
                    namespace,
                    values: vector.values,
                },
            })
            .catch((e) => e);
        if (!updateResponse) throw new Error("Initiate the Client before upserting a doc");
    }

    //

    /**
     * @param {string[]} vectorIDs
     * @param {string} namespace
     */

    async delete(vectorIDs, namespace) {
        const deleteResponse = await this.index
            ?.delete1({
                namespace,
                ids: vectorIDs,
            })
            .catch((e) => e);

        if (!deleteResponse) throw new Error("Initiate the Client before upserting a doc");
    }

    //

    /**
     * @param {string} namespace
     */

    async deleteAll(namespace) {
        const deleteResponse = await this.index
            ?.delete1({
                namespace,
                deleteAll: true,
            })
            .catch((e) => e);

        if (!deleteResponse) throw new Error("Initiate the Client before upserting a doc");
    }
};

//

/**
 * @typedef Vector
 * @property {string} id
 * @property {number[]} values
 * @property {{[index:string]: string|number}|undefined} metadata
 */
