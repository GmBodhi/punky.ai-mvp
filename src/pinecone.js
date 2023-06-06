const pinecone = require("@pinecone-database/pinecone");

module.exports.PineConeInstance = class PineConeInstance {
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
                    vectors,
                    namespace,
                },
            })
            .catch((e) => e);

        console.log(upsertResponse);
        if (!upsertResponse) throw new Error("PINECONE: Initiate the Client before upserting a doc");
        return upsertResponse.upsertedCount === vectors.length;
    }

    //

    /**
     * @param {Vector["values"]} vector
     * @param {string} namespace
     */
    async query(vector, namespace) {
        const queryResponse = await this.index?.query({
            queryRequest: { topK: 5, includeMetadata: true, namespace, vector },
        });

        if (!queryResponse) throw new Error("PINECONE: Initiate the Client before querying");

        return queryResponse.matches;
    }
};

//

/**
 * @typedef Vector
 * @property {string} id
 * @property {number[]} values
 * @property {object|undefined=} metadata
 */
