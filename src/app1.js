const { GPT } = require("./gpt");
const { PineConeInstance } = require("./pinecone");
const config = require("./config");
const { WebSpider } = require("./crawl");
const { Prisma } = require("./prisma");
const { DataContext } = require("./context");
const { GPTContext } = require("./context");

class App {
    constructor() {
        this.openai = new GPT({
            apiKey: config.OPENAI_APIKEY,
        });

        this.pinecone = new PineConeInstance({
            indexName: config.indexName,
            apiKey: config.PINECONE_APIKEY,
            environment: config.PINECONE_ENVIRONMENT,
        });

        this.spider = new WebSpider();

        this.prisma = new Prisma();
        this.data = new Map();
        this.currentQuestion = "";
        this.namespace = "";
    }

    async init() {
        await this.spider.launch();
        await this.pinecone.init();
        await this.prisma.conn();
    }

    async close() {
        await this.spider.close();
        await this.prisma.disconn();
    }

    async uploadData() {
        const data = []
        const temp = [...this.data.values()];

        temp.forEach(t => data.push(...t))

        

        const upsertedData = await this.prisma.writeDocuments(
            data.map((d) => ({ content: d.data, namespace: this.namespace }))
        );

        return await this.pinecone
            .upsert(
                data.map((d, i) => ({ ...d.vector, id: upsertedData.at(i)?.id || "" })),
                this.namespace
            )
            .catch((e) => e);
    }

    /**
     * @param {import("./gpt").EmbeddingData[]} embededData
     * @param {string=} id
     * @param {string} data
     */
    parseData(embededData, data, id) {
        return { vector: { values: embededData[0].embedding, id }, data };
    }

    /**
     * @param {string} url
     */
    async processPage(url) {
        const context = new DataContext();
        const html = await this.spider.crawl(url);
        const docs = [];

        context.setDatafromHTML(html.html());

        for (const data of context.data) {
            const embededData = await this.openai.createEmbedding(data).catch((e) => null);
            if (!embededData?.data) throw new Error("GPT: Request not satisfied");

            docs.push(this.parseData(embededData.data, data));
        }

        this.data.set(url, docs);
    }

    //

    // Front Facing APIs

    //

    /**
     * @param {string} URL
     */
    async getURLs(URL) {
        this.namespace = URL;
        const html = await this.spider.crawl(URL);
        this.urls = this.spider.detectPaths(html, URL);
        return this.urls;
    }

    async processDocuments(...urls) {
        this.data.clear();
        for (const url of urls) {
            await this.processPage(url);
            await this.uploadData();
        }
    }

    /**
     * @param {string} question
     */
    async searchQuestion(question) {
        const embededData = await this.openai.createEmbedding(question).catch(() => null);
        if (!embededData?.data) return null;

        const queries = await this.pinecone.query(embededData?.data[0].embedding, this.namespace).catch(() => null);
        if (!queries?.length) return null;

        const docs = await this.prisma.getDocuments(...queries.map((q) => q.id)).catch(() => null);
        if (!docs?.length) return null;

        this.context = new GPTContext(question, docs[0].content);
        const promt = this.context.toString();

        const response = await this.openai.completionWithContext(promt);
        console.log(response);
    }
}

module.exports = App;
