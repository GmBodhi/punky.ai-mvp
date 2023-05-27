const { GPT } = require("./gpt");
const { PineConeInstance } = require("./pinecone");
const config = require("./config");
const { WebSpider } = require("./crawl");

const openai = new GPT({
    apiKey: config.OPENAI_APIKEY,
});

const pinecone = new PineConeInstance({
    indexName: config.indexName,
    apiKey: config.PINECONE_APIKEY,
    environment: config.PINECONE_ENVIRONMENT,
});

const spider = new WebSpider();

//
//
//

module.exports.run = async function run(URL, NAMESPACE) {
    await spider.launch();
    await pinecone.init();

    /** @type {{embededData: import("./gpt").EmbeddingData[], url: string}[]} */
    const chunks = [];

    const html = await spider.crawl(URL);

    const mainPageData = spider.makeTextFromDOM(html);
    const mainPageEmbededData = await openai.createEmbedding(mainPageData).catch((e) => null);
    if (!mainPageEmbededData?.data) throw new Error("GPT: Request not satisfied");

    chunks.push({ embededData: mainPageEmbededData.data, url: URL });

    const urls = spider.detectPaths(html, URL);

    for (const url of urls) {
        const embededData = await processPage(url).catch((e) => e);

        chunks.push({ embededData, url });
    }

    const vectorBasedData = chunks.map(({ embededData, url }) => parseData(embededData, url));

    await uploadData(vectorBasedData, NAMESPACE);

    // const models = await openai.listModels();
    // console.log(models);
};

//

/**
 * @param {import("./pinecone").Vector[]} data
 * @param {string} namespace
 */
async function uploadData(data, namespace) {
    const res = await pinecone.upsert(data, namespace).catch((e) => e);
    console.log(res);
}

//

/**
 * @param {import("./gpt").EmbeddingData[]} data
 * @param {string} url
 */
const parseData = (data, url) => ({ values: data[0].embedding, id: url });

//

/** @param {string} url */
async function processPage(url) {
    const html = await spider.crawl(url);

    const data = spider.makeTextFromDOM(html);

    // /** @type {import("./gpt").EmbeddingResponse|null} */
    const embededData = await openai.createEmbedding(data).catch((e) => null);
    if (!embededData?.data) throw new Error("GPT: Request not satisfied");

    return embededData.data;
}
