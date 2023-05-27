const openai = require("openai");

module.exports.GPT = class GPT {
    //

    /**
     *
     * @param {{
     *  apiKey: string;
     *  organization?: string;
     * }} options
     */

    //

    constructor(options) {
        this.configuration = new openai.Configuration({
            apiKey: options.apiKey,
            organization: options.organization,
        });

        this.engine = new openai.OpenAIApi(this.configuration);

        this.model = "text-embedding-ada-002";
    }

    //

    /**
     * @param {string} input
     */

    //

    async createEmbedding(input) {
        const data = await this.engine
            .createEmbedding({
                model: this.model,
                input,
            })
            .then((r) => r.data)
            .catch((e) => e);

        if (!data.data) throw new Error(data);

        return data;
    }

    async listModels() {
        const models = await this.engine.listModels().catch((e) => e);
        if (!models.data?.data) throw new Error(models.data);

        return models.data.data;
    }
};
